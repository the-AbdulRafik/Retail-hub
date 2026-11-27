import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../../core/models/api-error.models';
import {
  ORDER_STATUSES,
  OrderResponse,
  OrderStatus,
} from '../../models/order.model';
import { OrderService } from '../../services/order.service';

const TRACKED_STATUSES = ORDER_STATUSES.filter(
  (status): status is Exclude<OrderStatus, 'Cancelled'> => status !== 'Cancelled'
);

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './order-details.html',
  styleUrl: './order-details.css',
})
export class OrderDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);

  readonly trackingStatuses = TRACKED_STATUSES;
  readonly order = signal<OrderResponse | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly statusIndex = computed(() => {
    const status = this.order()?.status;
    return status && status !== 'Cancelled' ? TRACKED_STATUSES.indexOf(status) : -1;
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (!Number.isInteger(id) || id <= 0) {
        this.order.set(null);
        this.loading.set(false);
        this.errorMessage.set('The order link is invalid.');
        return;
      }
      this.loadOrder(id);
    });
  }

  statusLabel(status: OrderStatus): string {
    return status === 'OutForDelivery' ? 'Out for delivery' : status;
  }

  isReached(index: number): boolean {
    return this.statusIndex() >= index;
  }

  isCurrent(index: number): boolean {
    return this.statusIndex() === index;
  }

  retry(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) {
      this.loadOrder(id);
    }
  }

  private loadOrder(id: number): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.orderService
      .getOrderById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.order.set(order);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.order.set(null);
          this.loading.set(false);
          this.errorMessage.set(
            extractApiErrorMessage(error, 'Unable to load this order. Please try again.')
          );
        },
      });
  }
}
