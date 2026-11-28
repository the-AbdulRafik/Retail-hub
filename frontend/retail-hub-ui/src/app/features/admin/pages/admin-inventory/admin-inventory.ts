import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  catchError,
  debounceTime,
  finalize,
  merge,
  of,
  switchMap,
} from 'rxjs';
import { extractApiErrorMessage } from '../../../../core/models/api-error.models';
import {
  InventoryApiService,
  InventoryItem,
  UpdateInventoryRequest,
} from '../../services/inventory-api.service';

@Component({
  selector: 'app-admin-inventory',
  imports: [FormsModule],
  templateUrl: './admin-inventory.html',
  styleUrl: './admin-inventory.css',
})
export class AdminInventory implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inventoryApi = inject(InventoryApiService);

  private readonly debouncedSearch$ = new Subject<void>();
  private readonly immediateLoad$ = new Subject<void>();

  protected inventory: InventoryItem[] = [];

  protected searchTerm = '';
  protected lowStockOnly = false;

  protected currentPage = 1;
  protected pageSize = 10;
  protected totalCount = 0;
  protected totalPages = 0;
  protected hasPreviousPage = false;
  protected hasNextPage = false;

  protected isLoading = false;
  protected isSaving = false;
  protected isReloadingConflict = false;
  protected hasConcurrencyConflict = false;

  protected errorMessage = '';
  protected successMessage = '';
  protected formError = '';

  protected showForm = false;
  protected selectedItem: InventoryItem | null = null;

  protected updatedQuantity: number | null = null;
  protected updatedReorderLevel: number | null = null;

  ngOnInit(): void {
    this.setupInventoryPipeline();
    this.loadInventory();
  }

  private setupInventoryPipeline(): void {
    merge(
      this.debouncedSearch$.pipe(debounceTime(350)),
      this.immediateLoad$,
    )
      .pipe(
        switchMap(() => {
          this.isLoading = true;
          this.errorMessage = '';
          this.cdr.markForCheck();

          return this.inventoryApi
            .getInventory({
              page: this.currentPage,
              pageSize: this.pageSize,
              search: this.searchTerm.trim() || undefined,
              lowStockOnly: this.lowStockOnly,
            })
            .pipe(
              catchError((error: unknown) => {
                this.errorMessage = extractApiErrorMessage(
                  error,
                  'Unable to load inventory. Please try again.',
                );
                this.inventory = [];
                this.totalCount = 0;
                this.totalPages = 0;
                this.hasPreviousPage = false;
                this.hasNextPage = false;
                return of(null);
              }),
              finalize(() => {
                this.isLoading = false;
                this.cdr.markForCheck();
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        this.inventory = [...response.items];
        this.currentPage = response.currentPage;
        this.pageSize = response.pageSize;
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
        this.hasPreviousPage = response.hasPreviousPage;
        this.hasNextPage = response.hasNextPage;
        this.cdr.markForCheck();
      });
  }

  protected loadInventory(): void {
    this.immediateLoad$.next();
  }

  protected onSearchInputChanged(): void {
    this.currentPage = 1;
    this.debouncedSearch$.next();
  }

  protected onFiltersChanged(): void {
    this.currentPage = 1;
    this.loadInventory();
  }

  protected goToPreviousPage(): void {
    if (this.hasPreviousPage && !this.isLoading) {
      this.currentPage--;
      this.loadInventory();
    }
  }

  protected goToNextPage(): void {
    if (this.hasNextPage && !this.isLoading) {
      this.currentPage++;
      this.loadInventory();
    }
  }

  protected getStockStatus(item: InventoryItem): string {
    if (item.stockQuantity === 0) {
      return 'Out of Stock';
    }

    if (item.isLowStock) {
      return 'Low Stock';
    }

    return 'In Stock';
  }

  protected isValidQuantity(value: number | string | null | undefined): boolean {
    if (value === null || value === undefined || String(value).trim() === '') {
      return false;
    }

    const quantity = Number(value);
    return Number.isInteger(quantity) && quantity >= 0;
  }

  protected openUpdateForm(item: InventoryItem): void {
    if (this.isSaving) {
      return;
    }

    this.selectedItem = item;
    this.updatedQuantity = item.stockQuantity;
    this.updatedReorderLevel = item.reorderLevel;
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.hasConcurrencyConflict = false;
    this.showForm = true;
  }

  protected reloadLatestItem(): void {
    if (!this.selectedItem || this.isReloadingConflict || this.isSaving) {
      return;
    }

    this.isReloadingConflict = true;
    this.formError = '';

    this.inventoryApi
      .getInventoryByProductId(this.selectedItem.productId)
      .pipe(
        finalize(() => {
          this.isReloadingConflict = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (latest) => {
          this.selectedItem = latest;
          this.updatedQuantity = latest.stockQuantity;
          this.updatedReorderLevel = latest.reorderLevel;
          this.hasConcurrencyConflict = false;
          this.inventory = this.inventory.map((row) =>
            row.productId === latest.productId ? latest : row,
          );
        },
        error: (error: unknown) => {
          this.formError = extractApiErrorMessage(
            error,
            'Unable to reload latest stock values.',
          );
        },
      });
  }

  protected updateStock(): void {
    if (!this.selectedItem || this.isSaving || this.isReloadingConflict) {
      return;
    }

    if (
      !this.isValidQuantity(this.updatedQuantity) ||
      !this.isValidQuantity(this.updatedReorderLevel)
    ) {
      this.formError = 'Enter valid non-negative whole numbers for both fields.';
      return;
    }

    const request: UpdateInventoryRequest = {
      stockQuantity: Number(this.updatedQuantity),
      reorderLevel: Number(this.updatedReorderLevel),
      rowVersion: this.selectedItem.rowVersion,
    };

    this.isSaving = true;
    this.formError = '';
    this.hasConcurrencyConflict = false;

    this.inventoryApi
      .updateInventory(this.selectedItem.productId, request)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Inventory updated successfully.';
          this.resetFormState();
          this.loadInventory();
        },
        error: (error: unknown) => {
          const status =
            typeof error === 'object' && error !== null && 'status' in error
              ? (error as { status?: number }).status
              : undefined;

          if (status === 409) {
            this.hasConcurrencyConflict = true;
          }

          this.formError = extractApiErrorMessage(
            error,
            status === 409
              ? 'Inventory changed elsewhere. Reload latest values and try again.'
              : 'Unable to update inventory.',
          );
        },
      });
  }

  protected closeForm(): void {
    if (this.isSaving || this.isReloadingConflict) {
      return;
    }

    this.resetFormState();
  }

  private resetFormState(): void {
    this.showForm = false;
    this.selectedItem = null;
    this.updatedQuantity = null;
    this.updatedReorderLevel = null;
    this.hasConcurrencyConflict = false;
    this.formError = '';
    this.cdr.markForCheck();
  }
}
