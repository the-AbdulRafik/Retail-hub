import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../core/config/api.config';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:5266/api' },
      ],
    });

    service = TestBed.inject(OrderService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('posts only product IDs and quantities to the documented order endpoint', () => {
    const items = [{ productId: 10, quantity: 2 }];

    service.createOrder({ items }).subscribe();

    const request = httpTestingController.expectOne('http://localhost:5266/api/orders');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ items });
    request.flush({});
  });

  it('requests the authenticated customer order list with supported filters', () => {
    service
      .getMyOrders({ page: 2, pageSize: 10, status: 'Pending', search: ' ORD-123 ' })
      .subscribe();

    const request = httpTestingController.expectOne(
      (candidate) =>
        candidate.url === 'http://localhost:5266/api/orders/my' &&
        candidate.params.get('page') === '2' &&
        candidate.params.get('pageSize') === '10' &&
        candidate.params.get('status') === 'Pending' &&
        candidate.params.get('search') === 'ORD-123'
    );
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('requests an order by its ID from the ownership-checked endpoint', () => {
    service.getOrderById(101).subscribe();

    const request = httpTestingController.expectOne('http://localhost:5266/api/orders/101');
    expect(request.request.method).toBe('GET');
    request.flush({});
  });
});
