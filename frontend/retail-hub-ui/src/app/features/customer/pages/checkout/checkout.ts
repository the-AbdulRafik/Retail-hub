import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../../core/models/api-error.models';
import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly items = this.cartService.items;
  readonly subtotal = this.cartService.subtotal;
  readonly total = this.cartService.total;
  readonly isEmpty = this.cartService.isEmpty;
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  placeOrder(): void {
    if (this.submitting()) {
      return;
    }

    const items = this.cartService.toOrderItems();
    if (items.length === 0) {
      this.errorMessage.set('Your cart is empty. Add products before placing an order.');
      return;
    }

    this.errorMessage.set('');
    this.submitting.set(true);
    this.orderService
      .createOrder({ items })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (order) => {
          this.cartService.clearCart();
          this.submitting.set(false);
          void this.router.navigate(['/customer/orders', order.id]);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.errorMessage.set(
            extractApiErrorMessage(error, 'Unable to place your order. Please try again.')
          );
        },
      });
  }
}
