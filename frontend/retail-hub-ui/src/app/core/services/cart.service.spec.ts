import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  let cartService: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    cartService = TestBed.inject(CartService);
  });

  it('adds, updates, removes, and clears items with accurate subtotals and totals', () => {
    cartService.addItem({ productId: 1, productName: 'Margherita', unitPrice: 12.5, maxStock: 5 }, 2);
    cartService.addItem({ productId: 2, productName: 'Cola', unitPrice: 2.25 }, 3);

    expect(cartService.itemCount()).toBe(5);
    expect(cartService.subtotal()).toBe(31.75);
    expect(cartService.total()).toBe(31.75);
    expect(cartService.toOrderItems()).toEqual([
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 3 },
    ]);

    cartService.updateQuantity(1, 10);
    expect(cartService.items().find((i) => i.productId === 1)?.quantity).toBe(5);

    cartService.removeItem(2);
    expect(cartService.itemCount()).toBe(5);
    expect(cartService.total()).toBe(62.5);

    cartService.clearCart();
    expect(cartService.isEmpty()).toBe(true);
    expect(cartService.total()).toBe(0);
  });
});
