import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { Product } from '../../services/product-api.service';
import { AdminProducts } from './admin-products';

describe('AdminProducts', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProducts],
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

  const sampleProduct: Product = {
    id: 3,
    name: 'Legacy Pizza',
    description: 'Classic crust',
    price: 13,
    imageUrl: 'https://example.com/pizza.jpg',
    brandId: 1,
    brandName: 'OvenCraft',
    categoryId: 1,
    categoryName: 'Pizza',
    packagingType: 'Box',
    packagingSize: 'Large',
    stockQuantity: 10,
    reorderLevel: 3,
    isActive: true,
    rowVersion: 'AAAA',
    createdAt: '2026-11-28T00:00:00Z',
  };

  function flushInitialRequests(
    products: unknown[] = [],
    brands: unknown[] = [{ id: 1, name: 'OvenCraft', description: null, isActive: true }],
    categories: unknown[] = [{ id: 1, name: 'Pizza', description: null, isActive: true }],
  ): void {
    httpMock
      .expectOne('http://localhost:5266/api/brands?includeInactive=true')
      .flush(brands);
    httpMock
      .expectOne('http://localhost:5266/api/categories?includeInactive=true')
      .flush(categories);
    httpMock
      .expectOne(
        'http://localhost:5266/api/products?page=1&pageSize=10&inStockOnly=false&includeInactive=false&sortBy=name&sortOrder=asc',
      )
      .flush({
        items: products,
        currentPage: 1,
        pageSize: 10,
        totalCount: products.length,
        totalPages: products.length > 0 ? 1 : 0,
        hasPreviousPage: false,
        hasNextPage: false,
      });
  }

  it('rejects cleared numeric price/stock instead of submitting 0 and validates min/max price filter', async () => {
    const fixture = TestBed.createComponent(AdminProducts);
    fixture.detectChanges();
    flushInitialRequests();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.page-heading h2')).toBeNull();
    expect(fixture.nativeElement.querySelector('.page-subtitle')?.textContent).toContain(
      'Manage your store products',
    );

    const component = fixture.componentInstance as unknown as {
      openAddForm: () => void;
      formData: {
        name: string;
        price: number | null;
        brandId: string;
        categoryId: string;
        packagingType: string;
        packagingSize: string;
        stockQuantity: number | null;
        reorderLevel: number | null;
      };
      saveProduct: () => void;
      formError: string;
      minPrice: number | null;
      maxPrice: number | null;
      onImmediateFilterChanged: () => void;
      filterError: string;
    };

    component.openAddForm();
    component.formData.name = 'Pepperoni Pizza';
    component.formData.brandId = '1';
    component.formData.categoryId = '1';
    component.formData.packagingType = 'Box';
    component.formData.packagingSize = 'Large';
    component.formData.price = null;
    component.saveProduct();

    expect(component.formError).toBe('Price is required.');

    component.minPrice = 100;
    component.maxPrice = 20;
    component.onImmediateFilterChanged();
    expect(component.filterError).toBe('Minimum price cannot be greater than maximum price.');
  });

  it('warns and blocks saving when editing a product with an inactive brand or category', async () => {
    const fixture = TestBed.createComponent(AdminProducts);
    fixture.detectChanges();
    flushInitialRequests(
      [{ ...sampleProduct, brandId: 2, brandName: 'OldBrand' }],
      [
        { id: 1, name: 'OvenCraft', description: null, isActive: true },
        { id: 2, name: 'OldBrand', description: null, isActive: false },
      ],
    );
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      products: Product[];
      openEditForm: (p: Product) => void;
      saveProduct: () => void;
      formError: string;
    };

    component.openEditForm(component.products[0]);
    component.saveProduct();

    expect(component.formError).toContain('Brand "OldBrand" is inactive');
  });

  it('closes the edit form, clears edit state, prevents duplicate submits, and refreshes products after update', async () => {
    const fixture = TestBed.createComponent(AdminProducts);
    fixture.detectChanges();
    flushInitialRequests([sampleProduct]);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      products: Product[];
      includeInactive: boolean;
      currentPage: number;
      showForm: boolean;
      isEditing: boolean;
      isSaving: boolean;
      selectedProduct: Product | null;
      successMessage: string;
      formData: { name: string; price: number | null };
      openEditForm: (p: Product) => void;
      saveProduct: () => void;
    };

    component.includeInactive = true;
    component.currentPage = 2;
    component.openEditForm(component.products[0]);
    fixture.detectChanges();

    expect(component.showForm).toBe(true);
    expect(component.isEditing).toBe(true);
    expect(component.selectedProduct?.id).toBe(3);
    expect(fixture.nativeElement.querySelector('.form-panel')).not.toBeNull();

    component.formData.name = 'Updated Margherita';
    component.formData.price = 15.5;
    component.saveProduct();
    fixture.detectChanges();

    expect(component.isSaving).toBe(true);
    const submitButton = fixture.nativeElement.querySelector(
      '.form-actions button[type="submit"]',
    ) as HTMLButtonElement | null;
    expect(submitButton?.disabled).toBe(true);

    // Triggering a second save while in flight must not send a duplicate request.
    component.saveProduct();
    const putReq = httpMock.expectOne('http://localhost:5266/api/products/3');
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body.name).toBe('Updated Margherita');

    const updatedProduct: Product = { ...sampleProduct, name: 'Updated Margherita', price: 15.5 };
    putReq.flush(updatedProduct);

    expect(component.isSaving).toBe(false);
    expect(component.showForm).toBe(false);
    expect(component.isEditing).toBe(false);
    expect(component.selectedProduct).toBeNull();
    expect(component.formData.name).toBe('');
    expect(component.formData.price).toBeNull();
    expect(component.successMessage).toBe('Product updated successfully.');

    const refreshReq = httpMock.expectOne(
      'http://localhost:5266/api/products?page=2&pageSize=10&inStockOnly=false&includeInactive=true&sortBy=name&sortOrder=asc',
    );
    refreshReq.flush({
      items: [updatedProduct],
      currentPage: 2,
      pageSize: 10,
      totalCount: 11,
      totalPages: 2,
      hasPreviousPage: true,
      hasNextPage: false,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.form-panel')).toBeNull();
    expect(fixture.nativeElement.querySelector('.success-message')?.textContent).toContain(
      'Product updated successfully.',
    );
    expect(fixture.nativeElement.textContent).toContain('Updated Margherita');
  });

  it('keeps the edit form open, preserves values, surfaces backend error, and resets loading state on failure', async () => {
    const fixture = TestBed.createComponent(AdminProducts);
    fixture.detectChanges();
    flushInitialRequests([sampleProduct]);
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      products: Product[];
      showForm: boolean;
      isEditing: boolean;
      isSaving: boolean;
      selectedProduct: Product | null;
      formError: string;
      formData: { name: string; price: number | null };
      openEditForm: (p: Product) => void;
      saveProduct: () => void;
    };

    component.openEditForm(component.products[0]);
    component.formData.name = 'Conflicting Pizza Name';
    component.formData.price = 19;
    component.saveProduct();
    fixture.detectChanges();

    const putReq = httpMock.expectOne('http://localhost:5266/api/products/3');
    putReq.flush(
      {
        title: 'Conflict',
        status: 409,
        detail: 'Product was modified by another request.',
      },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(component.isSaving).toBe(false);
    expect(component.showForm).toBe(true);
    expect(component.isEditing).toBe(true);
    expect(component.selectedProduct?.id).toBe(3);
    expect(component.formData.name).toBe('Conflicting Pizza Name');
    expect(component.formData.price).toBe(19);
    expect(component.formError).toBe('Product was modified by another request.');

    const submitButton = fixture.nativeElement.querySelector(
      '.form-actions button[type="submit"]',
    ) as HTMLButtonElement | null;
    expect(submitButton?.disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('.form-panel')).not.toBeNull();
  });
});
