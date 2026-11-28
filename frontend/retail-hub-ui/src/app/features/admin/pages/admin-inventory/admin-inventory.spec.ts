import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { InventoryItem } from '../../services/inventory-api.service';
import { AdminInventory } from './admin-inventory';

describe('AdminInventory', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminInventory],
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

  const sampleItem: InventoryItem = {
    productId: 10,
    productName: 'Margherita Pizza',
    brandName: 'OvenCraft',
    categoryName: 'Pizza',
    packagingType: 'Box',
    packagingSize: 'Large',
    stockQuantity: 12,
    reorderLevel: 5,
    isLowStock: false,
    isActive: false,
    rowVersion: 'v1',
  };

  it('rejects null/cleared numeric quantities and supports reloading after 409 conflict', async () => {
    const fixture = TestBed.createComponent(AdminInventory);
    fixture.detectChanges();

    httpMock
      .expectOne('http://localhost:5266/api/inventory?page=1&pageSize=10&lowStockOnly=false')
      .flush({
        items: [sampleItem],
        currentPage: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.page-heading h2')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Inactive');

    const component = fixture.componentInstance as unknown as {
      openUpdateForm: (item: InventoryItem) => void;
      updatedQuantity: number | null;
      updatedReorderLevel: number | null;
      updateStock: () => void;
      reloadLatestItem: () => void;
      formError: string;
      hasConcurrencyConflict: boolean;
      showForm: boolean;
      selectedItem: InventoryItem | null;
    };

    component.openUpdateForm(sampleItem);
    component.updatedQuantity = null;
    component.updateStock();
    expect(component.formError).toBe(
      'Enter valid non-negative whole numbers for both fields.',
    );

    component.updatedQuantity = 20;
    component.updateStock();
    const putReq = httpMock.expectOne('http://localhost:5266/api/inventory/10');
    putReq.flush(
      {
        title: 'Concurrency Conflict',
        status: 409,
        detail: 'The record was modified by another request.',
      },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(component.hasConcurrencyConflict).toBe(true);
    expect(component.formError).toBe('The record was modified by another request.');

    component.reloadLatestItem();
    const reloadReq = httpMock.expectOne('http://localhost:5266/api/inventory/10');
    reloadReq.flush({ ...sampleItem, stockQuantity: 8, rowVersion: 'v2' });
    fixture.detectChanges();

    expect(component.hasConcurrencyConflict).toBe(false);
    expect(component.selectedItem?.rowVersion).toBe('v2');
    expect(component.updatedQuantity).toBe(8);

    component.updatedQuantity = 15;
    component.updateStock();
    httpMock
      .expectOne('http://localhost:5266/api/inventory/10')
      .flush({ ...sampleItem, stockQuantity: 15, rowVersion: 'v3' });
    httpMock
      .expectOne('http://localhost:5266/api/inventory?page=1&pageSize=10&lowStockOnly=false')
      .flush({
        items: [{ ...sampleItem, stockQuantity: 15, rowVersion: 'v3' }],
        currentPage: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      });
    fixture.detectChanges();

    expect(component.showForm).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });
});
