import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface CartLineView {
  productId: number;
  name: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  availableStock: number;
}

export type CartPageViewState =
  | { status: 'unavailable' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'ready'; items: CartLineView[] };

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './shopping-cart.html',
  styleUrl: './shopping-cart.css',
})
export class ShoppingCart {
  readonly state = input<CartPageViewState>({ status: 'unavailable' });
  readonly quantityChange = output<{ productId: number; quantity: number }>();
  readonly removeItem = output<number>();

  readonly subtotal = computed(() => {
    const state = this.state();
    return state.status === 'ready'
      ? state.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      : 0;
  });

  changeQuantity(item: CartLineView, event: Event): void {
    const quantity = Number((event.target as HTMLInputElement).value);
    if (
      Number.isInteger(quantity) &&
      quantity > 0 &&
      quantity <= item.availableStock &&
      quantity !== item.quantity
    ) {
      this.quantityChange.emit({ productId: item.productId, quantity });
    }
  }
}
