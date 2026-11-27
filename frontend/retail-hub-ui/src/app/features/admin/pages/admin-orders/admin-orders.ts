import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';

import {
  OrdersApiService,
  Order,
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
  private readonly ordersApi = inject(OrdersApiService);

  protected readonly canManageOrders = false;

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
  protected updatedStatus: OrderStatus | '' = '';

  ngOnInit(): void {
    this.loadOrders();
  }

  protected loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.ordersApi
      .getOrders({
        page: this.currentPage,
        pageSize: this.pageSize,
        search: this.searchTerm.trim() || undefined,
        status: this.selectedStatus || undefined,
      })
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (response) => {
          this.orders = response.items;
          this.currentPage = response.currentPage;
          this.pageSize = response.pageSize;
          this.totalCount = response.totalCount;
          this.totalPages = response.totalPages;
          this.hasPreviousPage = response.hasPreviousPage;
          this.hasNextPage = response.hasNextPage;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Unable to load orders:', error);

          this.errorMessage =
            error.error?.detail ||
            error.error?.title ||
            'Unable to load orders. Please try again.';

          this.orders = [];
          this.totalCount = 0;
          this.totalPages = 0;
          this.cdr.markForCheck();
        },
      });
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

  protected openUpdateForm(order: Order): void {
    if (!this.canManageOrders) {
      return;
    }

    const allowed = this.getAllowedStatuses(order.status);

    if (allowed.length === 0) {
      return;
    }

    this.selectedOrder = order;
    this.updatedStatus = allowed[0];
    this.formError = '';
    this.showForm = true;
  }

  protected updateOrderStatus(): void {
    if (
      !this.canManageOrders ||
      !this.selectedOrder ||
      !this.updatedStatus ||
      this.isSaving
    ) {
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
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.successMessage = 'Order status updated successfully.';
          this.cdr.markForCheck();
          this.closeForm();
          this.loadOrders();
        },
        error: (error) => {
          console.error('Unable to update order status:', error);

          this.formError =
            error.error?.detail ||
            error.error?.title ||
            'Unable to update order status.';
          this.cdr.markForCheck();
        },
      });
  }

  protected closeForm(): void {
    this.showForm = false;
    this.selectedOrder = null;
    this.updatedStatus = '';
    this.formError = '';
  }

  protected getItemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  protected formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
