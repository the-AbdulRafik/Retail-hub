import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProductFilters } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CustomerHome } from './customer-home';

describe('CustomerHome', () => {
  let fixture: ComponentFixture<CustomerHome>;
  let requestedSearches: string[];

  beforeEach(async () => {
    requestedSearches = [];
    const productService = {
      getCategories: () => of([]),
      getBrands: () => of([]),
      getProducts: (filters: ProductFilters) => {
        requestedSearches.push(filters.search ?? '');
        return of({
          items: [],
          currentPage: filters.page,
          pageSize: filters.pageSize,
          totalCount: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        });
      },
    };

    await TestBed.configureTestingModule({
      imports: [CustomerHome],
      providers: [provideRouter([]), { provide: ProductService, useValue: productService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerHome);
    fixture.detectChanges();
  });

  it('cancels pending searches when clearing or resetting the search', async () => {
    const input = fixture.nativeElement.querySelector(
      'input[type="search"]'
    ) as HTMLInputElement;

    input.value = 'stale clear query';
    input.dispatchEvent(new Event('input'));
    fixture.componentInstance.clearSearch();
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 400));

    input.value = 'stale reset query';
    input.dispatchEvent(new Event('input'));
    fixture.componentInstance.resetFilters();
    fixture.detectChanges();

    await new Promise((resolve) => setTimeout(resolve, 400));

    expect(fixture.componentInstance.searchTerm()).toBe('');
    expect(requestedSearches).not.toContain('stale clear query');
    expect(requestedSearches).not.toContain('stale reset query');
  });

  it('labels the storefront search input accessibly', () => {
    const input = fixture.nativeElement.querySelector(
      'input[type="search"]'
    ) as HTMLInputElement;

    expect(input.getAttribute('aria-label')).toBe('Search products');
  });
});
