import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { AdminDashboard } from './admin-dashboard';

describe('AdminDashboard', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboard],
      providers: [
        provideRouter([]),
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

  it('displays genuine API counts and marks inactive low-stock products clearly', () => {
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();

    httpMock
      .expectOne('http://localhost:5266/api/orders?page=1&pageSize=5')
      .flush({
        items: [
          {
            id: 3,
            orderNumber: 'ORD-0003',
            userId: 'u1',
            customerName: 'System Admin',
            totalAmount: 13,
            status: 'Delivered',
            createdAt: '2026-11-28T00:00:00Z',
            items: [{ id: 1, productId: 1, productName: 'Pizza', unitPrice: 13, quantity: 1, packagingDetails: 'Box', lineTotal: 13 }],
          },
        ],
        currentPage: 1,
        pageSize: 5,
        totalCount: 3,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      });

    httpMock
      .expectOne('http://localhost:5266/api/inventory?page=1&pageSize=5&lowStockOnly=true')
      .flush({
        items: [
          {
            productId: 2,
            productName: 'GarlicBread',
            brandName: 'OvenCraft',
            categoryName: 'Breads',
            packagingType: 'Pack',
            packagingSize: '400g',
            stockQuantity: 4,
            reorderLevel: 5,
            isLowStock: true,
            isActive: false,
            rowVersion: 'AAAA',
          },
        ],
        currentPage: 1,
        pageSize: 5,
        totalCount: 2,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      });

    httpMock
      .expectOne(
        'http://localhost:5266/api/products?page=1&pageSize=1&inStockOnly=false&includeInactive=false&sortBy=name&sortOrder=asc',
      )
      .flush({
        items: [],
        currentPage: 1,
        pageSize: 1,
        totalCount: 12,
        totalPages: 12,
        hasPreviousPage: false,
        hasNextPage: true,
      });

    httpMock
      .expectOne('http://localhost:5266/api/brands?includeInactive=false')
      .flush([{ id: 1, name: 'OvenCraft', description: null, isActive: true }]);

    httpMock
      .expectOne('http://localhost:5266/api/categories?includeInactive=false')
      .flush([
        { id: 1, name: 'Pizza', description: null, isActive: true },
        { id: 2, name: 'Breads', description: null, isActive: true },
      ]);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.page-heading h2')).toBeNull();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('3');
    expect(text).toContain('12');
    expect(text).toContain('2 / 1');
    expect(text).toContain('GarlicBread');
    expect(text).toContain('(Inactive)');
    expect(fixture.nativeElement.querySelector('.status-badge.delivered')).toBeTruthy();
  });
});
