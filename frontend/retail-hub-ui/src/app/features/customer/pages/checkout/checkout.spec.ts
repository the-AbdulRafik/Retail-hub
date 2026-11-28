import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { CartService } from '../../../../core/services/cart.service';
import { CreateOrderRequest, OrderResponse } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
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
});
