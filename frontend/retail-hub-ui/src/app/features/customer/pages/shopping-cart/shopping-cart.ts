import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CartItem } from '../../../../core/models/cart.models';
import { CartService } from '../../../../core/services/cart.service';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { fetchLiveCartValidation, roundCurrency } from '../../utils/customer.utils';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.css',
})
export class ShoppingCart {
  private readonly cartService = inject(CartService);
  private readonly productService = inject(ProductService, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  readonly items = this.cartService.items;
  readonly itemCount = this.cartService.itemCount;
  readonly isEmpty = this.cartService.isEmpty;
  readonly errorMessage = signal('');
  readonly failedImageIds = signal<ReadonlySet<number>>(new Set());
  readonly liveProducts = signal<ReadonlyMap<number, Product>>(new Map());
  readonly unavailableProductIds = signal<ReadonlySet<number>>(new Set());

  readonly subtotal = computed<number>(() =>
    roundCurrency(this.items().reduce((sum, item) => sum + this.effectiveLineTotal(item), 0))
  );
  readonly total = computed<number>(() => this.subtotal());
  readonly hasStockIssue = computed<boolean>(() =>
    this.items().some((item) => this.isItemUnavailable(item) || this.exceedsStock(item))
  );

  constructor() {
    this.syncCartWithLiveCatalog();
  }

  effectiveMaxStock(item: CartItem): number | undefined {
    return this.liveProducts().get(item.productId)?.stockQuantity ?? item.maxStock;
  }

  effectiveUnitPrice(item: CartItem): number {
    return this.liveProducts().get(item.productId)?.price ?? item.unitPrice;
  }

  effectiveLineTotal(item: CartItem): number {
    return roundCurrency(this.effectiveUnitPrice(item) * item.quantity);
  }

  isItemUnavailable(item: CartItem): boolean {
    if (this.unavailableProductIds().has(item.productId)) {
      return true;
    }
    const maxStock = this.effectiveMaxStock(item);
    return maxStock !== undefined && maxStock <= 0;
  }

  exceedsStock(item: CartItem): boolean {
    const maxStock = this.effectiveMaxStock(item);
    return maxStock !== undefined && maxStock > 0 && item.quantity > maxStock;
  }

  decreaseQuantity(item: CartItem): void {
    if (this.isItemUnavailable(item) || item.quantity <= 1) {
      return;
    }

    const maxStock = this.effectiveMaxStock(item);
    const targetQty =
      maxStock !== undefined && item.quantity - 1 > maxStock ? maxStock : item.quantity - 1;
    this.errorMessage.set('');
    this.cartService.updateQuantity(item.productId, targetQty);
  }

  increaseQuantity(item: CartItem): void {
    if (this.isItemUnavailable(item)) {
      this.errorMessage.set(`${item.productName} is currently unavailable.`);
      return;
    }

    const maxStock = this.effectiveMaxStock(item);
    if (maxStock !== undefined && item.quantity >= maxStock) {
      this.errorMessage.set(`Only ${maxStock} unit(s) of ${item.productName} are available.`);
      return;
    }

    this.errorMessage.set('');
    this.cartService.updateQuantity(item.productId, item.quantity + 1);
  }

  changeQuantity(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const quantity = Number(input.value);
    if (!Number.isInteger(quantity) || quantity < 1) {
      input.value = String(item.quantity);
      this.errorMessage.set('Quantity must be a whole number greater than zero.');
      return;
    }

    const maxStock = this.effectiveMaxStock(item);
    if (maxStock !== undefined && quantity > maxStock) {
      input.value = String(item.quantity);
      this.errorMessage.set(`Only ${maxStock} unit(s) of ${item.productName} are available.`);
      return;
    }

    this.errorMessage.set('');
    this.cartService.updateQuantity(item.productId, quantity);
  }

  removeItem(productId: number): void {
    this.cartService.removeItem(productId);
    this.unavailableProductIds.update((ids) => {
      const next = new Set(ids);
      next.delete(productId);
      return next;
    });
    if (!this.hasStockIssue()) {
      this.errorMessage.set('');
    }
  }

  markImageFailed(productId: number): void {
    this.failedImageIds.update((failedIds) => new Set(failedIds).add(productId));
  }

  private syncCartWithLiveCatalog(): void {
    const currentItems = this.items();
    if (!this.productService || currentItems.length === 0) {
      return;
    }

    fetchLiveCartValidation(this.productService, currentItems)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ liveProducts, unavailableProductIds }) => {
        const notices: string[] = [];

        for (const item of currentItems) {
          if (unavailableProductIds.has(item.productId)) {
            this.cartService.updateItemMetadata(item.productId, { maxStock: 0 });
            notices.push(`${item.productName} is currently unavailable and must be removed.`);
            continue;
          }

          const product = liveProducts.get(item.productId);
          if (product) {
            if (item.quantity > product.stockQuantity) {
              this.cartService.updateQuantity(item.productId, product.stockQuantity);
              notices.push(
                `Quantity for ${product.name} was adjusted to available stock (${product.stockQuantity}).`
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
        if (notices.length > 0) {
          this.errorMessage.set(notices.join(' '));
        }
      });
  }
}
