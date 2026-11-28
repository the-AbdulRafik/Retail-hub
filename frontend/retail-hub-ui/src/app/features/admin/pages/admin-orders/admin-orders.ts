import { CurrencyPipe } from '@angular/common';
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
  Order,
  OrdersApiService,
  OrderStatus,
} from '../../services/orders-api.service';

@Component({
  selector: 'app-admin-orders',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './admin-orders.html',
  styleUrl: './admin-orders.css',
})
export class AdminOrders implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ordersApi = inject(OrdersApiService);

  private readonly debouncedSearch$ = new Subject<void>();
  private readonly immediateLoad$ = new Subject<void>();

  protected orders: Order[] = [];

  protected searchTerm = '';
  protected selectedStatus: OrderStatus | '' = '';

  protected readonly statuses: OrderStatus[] = [
    'Pending',
    'Confirmed',
    'Preparing',
    'OutForDelivery',
    'Delivered',
    'Cancelled',
  ];

  private readonly allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
    Pending: ['Confirmed', 'Cancelled'],
    Confirmed: ['Preparing', 'Cancelled'],
    Preparing: ['OutForDelivery', 'Cancelled'],
    OutForDelivery: ['Delivered'],
    Delivered: [],
    Cancelled: [],
  };

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
  protected selectedOrder: Order | null = null;
  protected inspectedOrder: Order | null = null;
  protected updatedStatus: OrderStatus | '' = '';

  ngOnInit(): void {
    this.setupOrdersPipeline();
    this.loadOrders();
  }

  private setupOrdersPipeline(): void {
    merge(
      this.debouncedSearch$.pipe(debounceTime(350)),
      this.immediateLoad$,
    )
      .pipe(
        switchMap(() => {
          this.isLoading = true;
          this.errorMessage = '';
          this.cdr.markForCheck();

          return this.ordersApi
            .getOrders({
              page: this.currentPage,
              pageSize: this.pageSize,
              search: this.searchTerm.trim() || undefined,
              status: this.selectedStatus || undefined,
            })
            .pipe(
              catchError((error: unknown) => {
                this.errorMessage = extractApiErrorMessage(
                  error,
                  'Unable to load orders. Please try again.',
                );
                this.orders = [];
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

        this.orders = [...response.items];
        this.currentPage = response.currentPage;
        this.pageSize = response.pageSize;
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
        this.hasPreviousPage = response.hasPreviousPage;
        this.hasNextPage = response.hasNextPage;
        this.cdr.markForCheck();
      });
  }

  protected loadOrders(): void {
    this.immediateLoad$.next();
  }

  protected onSearchInputChanged(): void {
    this.currentPage = 1;
    this.debouncedSearch$.next();
  }

  protected onFiltersChanged(): void {
    this.currentPage = 1;
    this.loadOrders();
  }

  protected goToPreviousPage(): void {
    if (this.hasPreviousPage && !this.isLoading) {
      this.currentPage--;
      this.loadOrders();
    }
  }

  protected goToNextPage(): void {
    if (this.hasNextPage && !this.isLoading) {
      this.currentPage++;
      this.loadOrders();
    }
  }

  protected getAllowedStatuses(status: OrderStatus): OrderStatus[] {
    return this.allowedTransitions[status];
  }

  protected getStatusClass(status: OrderStatus): string {
    return status.toLowerCase();
  }

  protected openOrderDetails(order: Order): void {
    this.inspectedOrder = order;
    this.cdr.markForCheck();
  }

  protected closeOrderDetails(): void {
    this.inspectedOrder = null;
    this.cdr.markForCheck();
  }

  protected openUpdateForm(order: Order): void {
    if (this.isSaving) {
      return;
    }

    const allowed = this.getAllowedStatuses(order.status);
    if (allowed.length === 0) {
      return;
    }

    this.selectedOrder = order;
    this.updatedStatus = allowed[0];
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showForm = true;
    this.cdr.markForCheck();
  }

  protected updateOrderStatus(): void {
    if (!this.selectedOrder || !this.updatedStatus || this.isSaving) {
      return;
    }

    const allowed = this.getAllowedStatuses(this.selectedOrder.status);
    if (!allowed.includes(this.updatedStatus)) {
      this.formError = 'This status transition is not allowed.';
      return;
    }

    this.isSaving = true;
    this.formError = '';

    this.ordersApi
      .updateOrderStatus(this.selectedOrder.id, {
        status: this.updatedStatus,
      })
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (updated) => {
          this.successMessage = `Order ${updated.orderNumber} updated to ${updated.status}.`;
          if (this.inspectedOrder?.id === updated.id) {
            this.inspectedOrder = updated;
          }
          this.resetFormState();
          this.loadOrders();
        },
        error: (error: unknown) => {
          this.formError = extractApiErrorMessage(
            error,
            'Unable to update order status.',
          );
          this.cdr.markForCheck();
        },
      });
  }

  protected closeForm(): void {
    if (this.isSaving) {
      return;
    }

    this.resetFormState();
  }

  private resetFormState(): void {
    this.showForm = false;
    this.selectedOrder = null;
    this.updatedStatus = '';
    this.formError = '';
    this.cdr.markForCheck();
  }

  protected getItemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  protected formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
