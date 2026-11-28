import { computed, Injectable, signal } from '@angular/core';
import { CartItem, CartItemInput } from '../models/cart.models';

const CART_STORAGE_KEY = 'retailhub.customer.cart';

/**
 * Shared client-side cart state service for the Customer Portal with browser storage persistence.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsState = signal<readonly CartItem[]>(this.restoreCart());

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
      let next: readonly CartItem[];
      const existing = current.find((item) => item.productId === product.productId);
      if (!existing) {
        const clampedQty = clampQuantity(normalizedQty, product.maxStock);
        if (clampedQty <= 0) {
          return current;
        }
        next = [
          ...current,
          {
            ...product,
            quantity: clampedQty,
            subtotal: roundCurrency(product.unitPrice * clampedQty),
          },
        ];
      } else {
        const nextQty = clampQuantity(
          existing.quantity + normalizedQty,
          product.maxStock ?? existing.maxStock
        );
        next = current.map((item) =>
          item.productId === product.productId
            ? {
                ...item,
                ...product,
                quantity: nextQty,
                subtotal: roundCurrency(product.unitPrice * nextQty),
              }
            : item
        );
      }
      this.safeWriteStorage(next);
      return next;
    });
  }

  updateQuantity(productId: number, quantity: number): void {
    const normalizedQty = Math.floor(quantity);
    if (normalizedQty <= 0) {
      this.removeItem(productId);
      return;
    }

    this.itemsState.update((current) => {
      const next = current.map((item) => {
        if (item.productId !== productId) {
          return item;
        }
        const nextQty = clampQuantity(normalizedQty, item.maxStock);
        return {
          ...item,
          quantity: nextQty,
          subtotal: roundCurrency(item.unitPrice * nextQty),
        };
      });
      this.safeWriteStorage(next);
      return next;
    });
  }

  updateItemMetadata(
    productId: number,
    updates: { maxStock?: number; unitPrice?: number }
  ): void {
    this.itemsState.update((current) => {
      const next = current.map((item) => {
        if (item.productId !== productId) {
          return item;
        }
        const unitPrice = updates.unitPrice ?? item.unitPrice;
        const maxStock = updates.maxStock !== undefined ? updates.maxStock : item.maxStock;
        return {
          ...item,
          unitPrice,
          maxStock,
          subtotal: roundCurrency(unitPrice * item.quantity),
        };
      });
      this.safeWriteStorage(next);
      return next;
    });
  }

  removeItem(productId: number): void {
    this.itemsState.update((current) => {
      const next = current.filter((item) => item.productId !== productId);
      this.safeWriteStorage(next);
      return next;
    });
  }

  clearCart(): void {
    this.itemsState.set([]);
    this.safeRemoveStorage();
  }

  toOrderItems(): ReadonlyArray<{ productId: number; quantity: number }> {
    return this.itemsState().map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
  }

  private restoreCart(): readonly CartItem[] {
    return this.safeReadStorage();
  }

  private safeReadStorage(): readonly CartItem[] {
    try {
      if (typeof localStorage === 'undefined') {
        return [];
      }
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        this.safeRemoveStorage();
        return [];
      }
      const validItems = parsed.filter(isCartItem);
      if (validItems.length !== parsed.length) {
        this.safeWriteStorage(validItems);
      }
      return validItems;
    } catch {
      this.safeRemoveStorage();
      return [];
    }
  }

  private safeWriteStorage(items: readonly CartItem[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        if (items.length === 0) {
          localStorage.removeItem(CART_STORAGE_KEY);
        } else {
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
        }
      }
    } catch {
      // Ignore quota errors
    }
  }

  private safeRemoveStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
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

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item['productId'] === 'number' &&
    Number.isInteger(item['productId']) &&
    item['productId'] > 0 &&
    typeof item['productName'] === 'string' &&
    item['productName'].length > 0 &&
    typeof item['unitPrice'] === 'number' &&
    Number.isFinite(item['unitPrice']) &&
    item['unitPrice'] >= 0 &&
    typeof item['quantity'] === 'number' &&
    Number.isInteger(item['quantity']) &&
    item['quantity'] > 0 &&
    typeof item['subtotal'] === 'number' &&
    Number.isFinite(item['subtotal'])
  );
}
