import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EMPTY, Subject, catchError, switchMap, tap } from 'rxjs';
import { extractApiErrorMessage } from '../../../../core/models/api-error.models';
import { PaginatedResponse } from '../../../../core/models/pagination.models';
import { ORDER_STATUSES, OrderResponse, OrderStatus } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { normalizeUtcDate } from '../../utils/customer.utils';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css',
})
export class MyOrders {
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly orderRequests = new Subject<void>();

  readonly statuses = ORDER_STATUSES;
  readonly orders = signal<readonly OrderResponse[]>([]);
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly totalPages = signal(0);
  readonly hasPreviousPage = signal(false);
  readonly hasNextPage = signal(false);
  readonly status = signal<OrderStatus | ''>('');
  readonly search = signal('');
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.orderRequests
      .pipe(
        switchMap(() =>
          this.orderService
            .getMyOrders({
              page: this.page(),
              pageSize: this.pageSize,
              status: this.status() || undefined,
              search: this.search().trim() || undefined,
            })
            .pipe(
              tap((response: PaginatedResponse<OrderResponse>) => {
                this.orders.set(response.items);
                this.totalPages.set(response.totalPages);
                this.hasPreviousPage.set(response.hasPreviousPage);
                this.hasNextPage.set(response.hasNextPage);
                this.loading.set(false);
              }),
              catchError((error: unknown) => {
                this.orders.set([]);
                this.totalPages.set(0);
                this.hasPreviousPage.set(false);
                this.hasNextPage.set(false);
                this.loading.set(false);
                this.errorMessage.set(
                  extractApiErrorMessage(error, 'Unable to load your orders. Please try again.'),
                );
                return EMPTY;
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
    this.loadOrders();
  }

  updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  applySearch(event: Event): void {
    event.preventDefault();
    this.page.set(1);
    this.loadOrders();
  }

  updateStatus(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.status.set(ORDER_STATUSES.find((status) => status === value) ?? '');
    this.page.set(1);
    this.loadOrders();
  }

  changePage(page: number): void {
    if (page < 1 || page === this.page() || (this.totalPages() > 0 && page > this.totalPages())) {
      return;
    }
    this.page.set(page);
    this.loadOrders();
  }

  resetFilters(): void {
    this.search.set('');
    this.status.set('');
    this.page.set(1);
    this.loadOrders();
  }

  readonly normalizeUtcDate = normalizeUtcDate;

  loadOrders(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.orderRequests.next();
  }
}
