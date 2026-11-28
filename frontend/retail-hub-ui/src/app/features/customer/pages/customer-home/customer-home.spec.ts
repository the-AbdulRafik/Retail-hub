import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProductFilters } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CustomerHome } from './customer-home';

describe('CustomerHome', () => {
  let fixture: ComponentFixture<CustomerHome>;
  let requestedSearches: string[];
  let requestedFilters: ProductFilters[];

  beforeEach(async () => {
    requestedSearches = [];
    requestedFilters = [];
    const productService = {
      getCategories: () => of([]),
      getBrands: () => of([]),
      getProducts: (filters: ProductFilters) => {
        requestedSearches.push(filters.search ?? '');
        requestedFilters.push(filters);
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
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;

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
    const input = fixture.nativeElement.querySelector('input[type="search"]') as HTMLInputElement;

    expect(input.getAttribute('aria-label')).toBe('Search products');
  });

  it('applies valid price bounds alongside existing catalog filters', () => {
    const component = fixture.componentInstance;
    component.searchTerm.set('bread');
    component.selectedBrand.set(4);
    component.selectCategory(2);
    component.minPriceInput.set('1.50');
    component.maxPriceInput.set('12');

    component.applyPriceFilter();

    expect(requestedFilters.at(-1)).toMatchObject({
      search: 'bread',
      categoryId: 2,
      brandId: 4,
      minPrice: 1.5,
      maxPrice: 12,
      page: 1,
    });
    expect(component.priceFilterError()).toBe('');
  });

  it('rejects negative values and minimum prices greater than maximum prices', () => {
    const component = fixture.componentInstance;
    const initialRequestCount = requestedFilters.length;

    component.minPriceInput.set('-1');
    component.applyPriceFilter();

    expect(component.priceFilterError()).toBe('Prices must be between 0 and 999999.99.');

    component.minPriceInput.set('10');
    component.maxPriceInput.set('5');
    component.applyPriceFilter();

    expect(component.priceFilterError()).toBe('Minimum price must not exceed maximum price.');
    expect(requestedFilters).toHaveLength(initialRequestCount);
  });
});
