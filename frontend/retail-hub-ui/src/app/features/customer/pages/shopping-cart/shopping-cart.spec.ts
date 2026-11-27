import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { ShoppingCart } from './shopping-cart';

describe('ShoppingCart', () => {
  let cartService: CartService;
  let fixture: ComponentFixture<ShoppingCart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShoppingCart],
      providers: [provideRouter([])],
    }).compileComponents();

    cartService = TestBed.inject(CartService);
    fixture = TestBed.createComponent(ShoppingCart);
    fixture.detectChanges();
  });

  it('shows an empty state when the shared cart has no items', () => {
    expect(fixture.nativeElement.textContent).toContain('Your cart is empty');
  });

  it('updates and removes cart items while enforcing available stock', () => {
    cartService.addItem(
      {
        productId: 7,
        productName: 'Sample product',
        unitPrice: 2.5,
        packagingDetails: 'Box - Small',
        maxStock: 4,
      },
      2
    );
    fixture.detectChanges();

    const quantityInput = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    quantityInput.value = '5';
    quantityInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(cartService.items()[0].quantity).toBe(2);
    expect(quantityInput.value).toBe('2');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Only 4 unit(s)'
    );

    quantityInput.value = '3';
    quantityInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(cartService.items()[0].quantity).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('7.50');

    (fixture.nativeElement.querySelector('.remove-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(cartService.isEmpty()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Your cart is empty');
  });
});
