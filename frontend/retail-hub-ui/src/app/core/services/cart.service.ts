import { computed, Injectable, signal } from '@angular/core';
import { CartItem, CartItemInput } from '../models/cart.models';

/**
 * Minimal shared client-side cart state contract for the Customer Portal.
 *
 * Notice: the `feature/customer-portal` branch was not present locally or remotely when this
 * foundation was created. Checkout HTTP integration (`POST /api/orders`) belongs to the
 * Customer feature; `toOrderItems()` provides the minimal `{ productId, quantity }` payload
 * expected by the backend without trusting client prices or totals.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsState = signal<readonly CartItem[]>([]);

  readonly items = this.itemsState.asReadonly();
  readonly itemCount = computed<number>(() =>
    this.itemsState().reduce((sum, item) => sum + item.quantity, 0)
  );
  readonly subtotal = computed<number>(() =>
    roundCurrency(this.itemsState().reduce((sum, item) => sum + item.subtotal, 0))
  );
  readonly total = computed<number>(() => this.subtotal());
  readonly isEmpty = computed<boolean>(() => this.itemsState().length === 0);

  addItem(product: CartItemInput, quantity = 1): void {
    const normalizedQty = Math.floor(quantity);
    if (normalizedQty <= 0) {
      return;
    }

    this.itemsState.update((current) => {
      const existing = current.find((item) => item.productId === product.productId);
      if (!existing) {
        const clampedQty = clampQuantity(normalizedQty, product.maxStock);
        if (clampedQty <= 0) {
          return current;
        }
        return [
          ...current,
          {
            ...product,
            quantity: clampedQty,
            subtotal: roundCurrency(product.unitPrice * clampedQty),
          },
        ];
      }

      const nextQty = clampQuantity(
        existing.quantity + normalizedQty,
        product.maxStock ?? existing.maxStock
      );
      return current.map((item) =>
        item.productId === product.productId
          ? {
              ...item,
              ...product,
              quantity: nextQty,
              subtotal: roundCurrency(product.unitPrice * nextQty),
            }
          : item
      );
    });
  }

  updateQuantity(productId: number, quantity: number): void {
    const normalizedQty = Math.floor(quantity);
    if (normalizedQty <= 0) {
      this.removeItem(productId);
      return;
    }

    this.itemsState.update((current) =>
      current.map((item) => {
        if (item.productId !== productId) {
          return item;
        }
        const nextQty = clampQuantity(normalizedQty, item.maxStock);
        return {
          ...item,
          quantity: nextQty,
          subtotal: roundCurrency(item.unitPrice * nextQty),
        };
      })
    );
  }

  removeItem(productId: number): void {
    this.itemsState.update((current) =>
      current.filter((item) => item.productId !== productId)
    );
  }

  clearCart(): void {
    this.itemsState.set([]);
  }

  toOrderItems(): ReadonlyArray<{ productId: number; quantity: number }> {
    return this.itemsState().map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
  }
}

function clampQuantity(quantity: number, maxStock?: number): number {
  if (typeof maxStock === 'number' && maxStock >= 0) {
    return Math.min(quantity, maxStock);
  }
  return quantity;
}

function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
