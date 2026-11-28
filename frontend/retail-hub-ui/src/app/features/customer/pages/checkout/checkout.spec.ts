import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { CartService } from '../../../../core/services/cart.service';
import { CreateOrderRequest, OrderResponse } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { Checkout } from './checkout';

@Component({ standalone: true, template: '' })
class OrderDestination {}

describe('Checkout', () => {
  let fixture: ComponentFixture<Checkout>;
  let cartService: CartService;
  let orderResult: Observable<OrderResponse>;
  let submittedRequest: CreateOrderRequest | null;

  const createdOrder: OrderResponse = {
    id: 21,
    orderNumber: 'ORD-21',
    userId: 'customer-1',
    customerName: 'Customer',
    totalAmount: 5,
    status: 'Pending',
    createdAt: '2026-01-01T10:00:00Z',
    items: [],
  };

  beforeEach(async () => {
    orderResult = of(createdOrder);
    submittedRequest = null;
    const orderService = {
      createOrder: (request: CreateOrderRequest) => {
        submittedRequest = request;
        return orderResult;
      },
    };

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideRouter([{ path: 'customer/orders/:id', component: OrderDestination }]),
        { provide: OrderService, useValue: orderService },
      ],
    }).compileComponents();

    cartService = TestBed.inject(CartService);
    cartService.addItem({ productId: 7, productName: 'Product', unitPrice: 2.5 }, 2);
    fixture = TestBed.createComponent(Checkout);
    fixture.detectChanges();
  });

  it('submits only product IDs and quantities, then clears the cart on success', () => {
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(submittedRequest).toEqual({ items: [{ productId: 7, quantity: 2 }] });
    expect(cartService.isEmpty()).toBe(true);
  });

  it('keeps the cart and reports an API error when order placement fails', () => {
    orderResult = throwError(
      () => new HttpErrorResponse({ status: 409, error: { detail: 'Insufficient stock.' } })
    );

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(cartService.isEmpty()).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Insufficient stock.'
    );
  });

  it('blocks order placement when live stock is lower than cart quantity', () => {
    const product: Product = {
      id: 7,
      name: 'Product',
      description: null,
      price: 2.5,
      imageUrl: null,
      brandId: 1,
      brandName: 'Brand',
      categoryId: 1,
      categoryName: 'Category',
      packagingType: 'Box',
      packagingSize: 'Small',
      stockQuantity: 1,
      reorderLevel: 1,
      isActive: true,
      rowVersion: '',
      createdAt: '2026-01-01T00:00:00Z',
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideRouter([{ path: 'customer/orders/:id', component: OrderDestination }]),
        { provide: OrderService, useValue: { createOrder: () => of(createdOrder) } },
        { provide: ProductService, useValue: { getProductById: () => of(product) } },
      ],
    });

    const localCart = TestBed.inject(CartService);
    localCart.addItem({ productId: 7, productName: 'Product', unitPrice: 2.5 }, 2);
    const localFixture = TestBed.createComponent(Checkout);
    localFixture.detectChanges();

    const button = localFixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(localFixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Only 1 unit(s) of Product are available.'
    );
  });
});
