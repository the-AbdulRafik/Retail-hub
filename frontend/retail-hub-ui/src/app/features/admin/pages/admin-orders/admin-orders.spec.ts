import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { Order } from '../../services/orders-api.service';
import { AdminOrders } from './admin-orders';

describe('AdminOrders', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOrders],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:5266/api' },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  const sampleOrder: Order = {
    id: 5,
    orderNumber: 'ORD-20261128-0005',
    userId: 'cust-1',
    customerName: 'Abdul Rafik',
    totalAmount: 26,
    status: 'Pending',
    createdAt: '2026-11-28T09:00:00Z',
    items: [
      {
        id: 1,
        productId: 1,
        productName: 'Margherita Pizza',
        unitPrice: 13,
        quantity: 2,
        packagingDetails: 'Box - Large 12in',
        lineTotal: 26,
      },
    ],
  };

  it('displays order line items and updates status with status badge classes', async () => {
    const fixture = TestBed.createComponent(AdminOrders);
    fixture.detectChanges();

    httpMock
      .expectOne('http://localhost:5266/api/orders?page=1&pageSize=10')
      .flush({
        items: [sampleOrder],
        currentPage: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.page-heading h2')).toBeNull();
    const badge = fixture.nativeElement.querySelector('.status-badge.pending');
    expect(badge?.textContent?.trim()).toBe('Pending');

    const component = fixture.componentInstance as unknown as {
      showForm: boolean;
      openOrderDetails: (o: Order) => void;
      openUpdateForm: (o: Order) => void;
      updatedStatus: string;
      updateOrderStatus: () => void;
    };

    component.openOrderDetails(sampleOrder);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Margherita Pizza');
    expect(fixture.nativeElement.textContent).toContain('Box - Large 12in');

    component.openUpdateForm(sampleOrder);
    component.updatedStatus = 'Confirmed';
    component.updateOrderStatus();

    const patchReq = httpMock.expectOne('http://localhost:5266/api/orders/5/status');
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ ...sampleOrder, status: 'Confirmed' });

    httpMock
      .expectOne('http://localhost:5266/api/orders?page=1&pageSize=10')
      .flush({
        items: [{ ...sampleOrder, status: 'Confirmed' }],
        currentPage: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      });
    fixture.detectChanges();

    expect(component.showForm).toBe(false);
    expect(
      fixture.nativeElement.querySelector('[aria-label="Update order status"]'),
    ).toBeNull();
    expect(fixture.nativeElement.querySelector('.status-badge.confirmed')?.textContent?.trim()).toBe(
      'Confirmed',
    );
  });
});
