import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  let cartService: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    cartService = TestBed.inject(CartService);
  });

  afterEach(() => {
    localStorage.clear();
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

  it('persists cart items to localStorage and restores them upon service initialization', () => {
    cartService.addItem({ productId: 10, productName: 'Pasta', unitPrice: 4.5, maxStock: 10 }, 3);

    const storedRaw = localStorage.getItem('retailhub.customer.cart');
    expect(storedRaw).toBeTruthy();
    expect(storedRaw).toContain('"productId":10');
    expect(storedRaw).toContain('"quantity":3');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const restoredService = TestBed.inject(CartService);

    expect(restoredService.items()).toHaveLength(1);
    expect(restoredService.items()[0].productName).toBe('Pasta');
    expect(restoredService.itemCount()).toBe(3);
    expect(restoredService.total()).toBe(13.5);
  });

  it('removes the storage key when the cart is cleared', () => {
    cartService.addItem({ productId: 10, productName: 'Pasta', unitPrice: 4.5 }, 2);
    expect(localStorage.getItem('retailhub.customer.cart')).toBeTruthy();

    cartService.clearCart();
    expect(localStorage.getItem('retailhub.customer.cart')).toBeNull();
  });

  it('handles invalid or corrupted localStorage data gracefully without throwing', () => {
    localStorage.setItem('retailhub.customer.cart', '{ invalid json ');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const fallbackService = TestBed.inject(CartService);

    expect(fallbackService.isEmpty()).toBe(true);
    expect(fallbackService.total()).toBe(0);
  });

  it('updates item metadata such as live stock and price', () => {
    cartService.addItem({ productId: 5, productName: 'Cereal', unitPrice: 5.0, maxStock: 10 }, 4);

    cartService.updateItemMetadata(5, { maxStock: 2, unitPrice: 6.0 });

    const item = cartService.items()[0];
    expect(item.quantity).toBe(4);
    expect(item.maxStock).toBe(2);
    expect(item.unitPrice).toBe(6.0);
    expect(item.subtotal).toBe(24.0);
  });
});
