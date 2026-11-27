import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

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
  private readonly inventoryApi = inject(InventoryApiService);

  // Enable only after the shared Admin authentication is integrated.
  protected readonly canManageInventory = false;

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

  protected errorMessage = '';
  protected successMessage = '';
  protected formError = '';

  protected showForm = false;
  protected selectedItem: InventoryItem | null = null;

  protected updatedQuantity = '';
  protected updatedReorderLevel = '';

  ngOnInit(): void {
    this.loadInventory();
  }

  protected loadInventory(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.inventoryApi
      .getInventory({
        page: this.currentPage,
        pageSize: this.pageSize,
        search: this.searchTerm.trim() || undefined,
        lowStockOnly: this.lowStockOnly,
      })
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.inventory = response.items;
          this.currentPage = response.currentPage;
          this.pageSize = response.pageSize;
          this.totalCount = response.totalCount;
          this.totalPages = response.totalPages;
          this.hasPreviousPage = response.hasPreviousPage;
          this.hasNextPage = response.hasNextPage;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Unable to load inventory:', error);

          this.errorMessage =
            error.error?.detail ||
            error.error?.title ||
            'Unable to load inventory. Please try again.';

          this.inventory = [];
          this.totalCount = 0;
          this.totalPages = 0;
          this.cdr.markForCheck();
        },
      });
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

  protected get lowStockCount(): number {
    return this.inventory.filter((item) => item.isLowStock).length;
  }

  protected get outOfStockCount(): number {
    return this.inventory.filter((item) => item.stockQuantity === 0).length;
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

  protected isValidQuantity(value: string): boolean {
    const quantity = Number(value);
    return value !== '' && Number.isInteger(quantity) && quantity >= 0;
  }

  protected openUpdateForm(item: InventoryItem): void {
    if (!this.canManageInventory) {
      return;
    }

    this.selectedItem = item;
    this.updatedQuantity = String(item.stockQuantity);
    this.updatedReorderLevel = String(item.reorderLevel);
    this.formError = '';
    this.showForm = true;
  }

  protected updateStock(): void {
    if (
      !this.canManageInventory ||
      !this.selectedItem ||
      this.isSaving
    ) {
      return;
    }

    const stockQuantity = Number(this.updatedQuantity);
    const reorderLevel = Number(this.updatedReorderLevel);

    if (
      !this.isValidQuantity(this.updatedQuantity) ||
      !this.isValidQuantity(this.updatedReorderLevel)
    ) {
      this.formError = 'Enter valid non-negative whole numbers.';
      return;
    }

    const request: UpdateInventoryRequest = {
      stockQuantity,
      reorderLevel,
      rowVersion: this.selectedItem.rowVersion,
    };

    this.isSaving = true;
    this.formError = '';

    this.inventoryApi
      .updateInventory(this.selectedItem.productId, request)
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.successMessage = 'Inventory updated successfully.';
          this.cdr.markForCheck();
          this.closeForm();
          this.loadInventory();
        },
        error: (error) => {
          console.error('Unable to update inventory:', error);

          this.formError =
            error.error?.detail ||
            error.error?.title ||
            (error.status === 409
              ? 'Inventory changed elsewhere. Reload and try again.'
              : 'Unable to update inventory.');
          this.cdr.markForCheck();
        },
      });
  }

  protected closeForm(): void {
    this.showForm = false;
    this.selectedItem = null;
    this.updatedQuantity = '';
    this.updatedReorderLevel = '';
    this.formError = '';
  }
}
