import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartItem } from '../../../../core/models/cart.models';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.css',
})
export class ShoppingCart {
  private readonly cartService = inject(CartService);

  readonly items = this.cartService.items;
  readonly itemCount = this.cartService.itemCount;
  readonly subtotal = this.cartService.subtotal;
  readonly total = this.cartService.total;
  readonly isEmpty = this.cartService.isEmpty;
  readonly errorMessage = signal('');
  readonly failedImageIds = signal<ReadonlySet<number>>(new Set());

  changeQuantity(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const quantity = Number(input.value);
    if (!Number.isInteger(quantity) || quantity < 1) {
      input.value = String(item.quantity);
      this.errorMessage.set('Quantity must be a whole number greater than zero.');
      return;
    }

    if (item.maxStock !== undefined && quantity > item.maxStock) {
      input.value = String(item.quantity);
      this.errorMessage.set(`Only ${item.maxStock} unit(s) of ${item.productName} are available.`);
      return;
    }

    this.errorMessage.set('');
    this.cartService.updateQuantity(item.productId, quantity);
  }

  removeItem(productId: number): void {
    this.errorMessage.set('');
    this.cartService.removeItem(productId);
  }

  markImageFailed(productId: number): void {
    this.failedImageIds.update((failedIds) => new Set(failedIds).add(productId));
  }
}
