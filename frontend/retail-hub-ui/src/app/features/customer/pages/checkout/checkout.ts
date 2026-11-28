import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { extractApiErrorMessage } from '../../../../core/models/api-error.models';
import { CartItem } from '../../../../core/models/cart.models';
import { CartService } from '../../../../core/services/cart.service';
import { Product } from '../../models/product.model';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { fetchLiveCartValidation, roundCurrency } from '../../utils/customer.utils';

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
  private readonly productService = inject(ProductService, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly items = this.cartService.items;
  readonly isEmpty = this.cartService.isEmpty;
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly liveProducts = signal<ReadonlyMap<number, Product>>(new Map());
  readonly unavailableProductIds = signal<ReadonlySet<number>>(new Set());

  readonly subtotal = computed<number>(() =>
    roundCurrency(this.items().reduce((sum, item) => sum + this.effectiveLineTotal(item), 0))
  );
  readonly total = computed<number>(() => this.subtotal());
  readonly hasStockIssue = computed<boolean>(() =>
    this.items().some((item) => {
      if (this.unavailableProductIds().has(item.productId)) {
        return true;
      }
      const maxStock = this.liveProducts().get(item.productId)?.stockQuantity ?? item.maxStock;
      return maxStock !== undefined && (maxStock <= 0 || item.quantity > maxStock);
    })
  );

  constructor() {
    this.verifyCartItems();
  }

  effectiveUnitPrice(item: CartItem): number {
    return this.liveProducts().get(item.productId)?.price ?? item.unitPrice;
  }

  effectiveLineTotal(item: CartItem): number {
    return roundCurrency(this.effectiveUnitPrice(item) * item.quantity);
  }

  placeOrder(): void {
    if (this.submitting()) {
      return;
    }

    const items = this.cartService.toOrderItems();
    if (items.length === 0) {
      this.errorMessage.set('Your cart is empty. Add products before placing an order.');
      return;
    }

    if (this.hasStockIssue()) {
      this.errorMessage.set(
        'Some items in your cart are unavailable or exceed available stock. Please update your cart first.'
      );
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

  private verifyCartItems(): void {
    const currentItems = this.items();
    if (!this.productService || currentItems.length === 0) {
      return;
    }

    fetchLiveCartValidation(this.productService, currentItems)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ liveProducts, unavailableProductIds }) => {
        const issues: string[] = [];

        for (const item of currentItems) {
          if (unavailableProductIds.has(item.productId)) {
            this.cartService.updateItemMetadata(item.productId, { maxStock: 0 });
            issues.push(`${item.productName} is currently unavailable.`);
            continue;
          }

          const product = liveProducts.get(item.productId);
          if (product) {
            if (item.quantity > product.stockQuantity) {
              issues.push(
                `Only ${product.stockQuantity} unit(s) of ${product.name} are available.`
              );
            }
            if (product.stockQuantity !== item.maxStock || product.price !== item.unitPrice) {
              this.cartService.updateItemMetadata(item.productId, {
                maxStock: product.stockQuantity,
                unitPrice: product.price,
              });
            }
          }
        }

        this.liveProducts.set(liveProducts);
        this.unavailableProductIds.set(unavailableProductIds);
        if (issues.length > 0) {
          this.errorMessage.set(`${issues.join(' ')} Return to cart to update your items.`);
        }
      });
  }
}
