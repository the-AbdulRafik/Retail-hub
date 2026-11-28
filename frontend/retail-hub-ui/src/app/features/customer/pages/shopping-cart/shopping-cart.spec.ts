import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CartService } from '../../../../core/services/cart.service';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ShoppingCart } from './shopping-cart';

describe('ShoppingCart', () => {
  let cartService: CartService;
  let fixture: ComponentFixture<ShoppingCart>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ShoppingCart],
      providers: [provideRouter([])],
    }).compileComponents();

    cartService = TestBed.inject(CartService);
    fixture = TestBed.createComponent(ShoppingCart);
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
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

  it('increases and decreases item quantities using stepper buttons while respecting stock', () => {
    cartService.addItem(
      {
        productId: 9,
        productName: 'Juice',
        unitPrice: 10,
        maxStock: 2,
      },
      1
    );
    fixture.detectChanges();

    const decBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Decrease quantity"]'
    ) as HTMLButtonElement;
    const incBtn = fixture.nativeElement.querySelector(
      'button[aria-label="Increase quantity"]'
    ) as HTMLButtonElement;

    expect(decBtn.disabled).toBe(true);
    expect(incBtn.disabled).toBe(false);

    incBtn.click();
    fixture.detectChanges();
    expect(cartService.items()[0].quantity).toBe(2);
    expect(incBtn.disabled).toBe(true);
    expect(decBtn.disabled).toBe(false);

    decBtn.click();
    fixture.detectChanges();
    expect(cartService.items()[0].quantity).toBe(1);
  });

  it('disables controls and checkout for out-of-stock products restored from storage', async () => {
    const outOfStockProduct: Product = {
      id: 15,
      name: 'Sold Out Item',
      description: null,
      price: 20,
      imageUrl: null,
      brandId: 1,
      brandName: 'Brand',
      categoryId: 1,
      categoryName: 'Category',
      packagingType: 'Box',
      packagingSize: '1 kg',
      stockQuantity: 0,
      reorderLevel: 5,
      isActive: true,
      rowVersion: '',
      createdAt: '2026-01-01T00:00:00Z',
    };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ShoppingCart],
      providers: [
        provideRouter([]),
        {
          provide: ProductService,
          useValue: { getProductById: () => of(outOfStockProduct) },
        },
      ],
    }).compileComponents();

    const testCartService = TestBed.inject(CartService);
    testCartService.addItem(
      { productId: 15, productName: 'Sold Out Item', unitPrice: 20, maxStock: 5 },
      2
    );

    const testFixture = TestBed.createComponent(ShoppingCart);
    testFixture.detectChanges();

    expect(testFixture.nativeElement.textContent).toContain('Currently unavailable');
    expect(testFixture.nativeElement.textContent).toContain(
      'Sold Out Item is currently unavailable and must be removed.'
    );

    const checkoutBtn = testFixture.nativeElement.querySelector('.summary button') as HTMLButtonElement;
    expect(checkoutBtn).toBeTruthy();
    expect(checkoutBtn.disabled).toBe(true);

    const stepButtons = testFixture.nativeElement.querySelectorAll('.step-button') as NodeListOf<HTMLButtonElement>;
    stepButtons.forEach((btn) => expect(btn.disabled).toBe(true));

    (testFixture.nativeElement.querySelector('.remove-button') as HTMLButtonElement).click();
    testFixture.detectChanges();

    expect(testCartService.isEmpty()).toBe(true);
    expect(testFixture.nativeElement.textContent).toContain('Your cart is empty');
  });
});
