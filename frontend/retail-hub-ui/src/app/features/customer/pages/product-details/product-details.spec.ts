import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { ProductDetails } from './product-details';

describe('ProductDetails', () => {
  let fixture: ComponentFixture<ProductDetails>;
  let routeParams: BehaviorSubject<ParamMap>;
  let requestedIds: number[];

  const createProduct = (id: number): Product => ({
    id,
    name: `Product ${id}`,
    description: null,
    price: 4.5,
    imageUrl: null,
    brandId: 1,
    brandName: 'Brand',
    categoryId: 1,
    categoryName: 'Category',
    packagingType: 'Box',
    packagingSize: 'Small',
    stockQuantity: 3,
    reorderLevel: 1,
    isActive: true,
    rowVersion: '',
    createdAt: '2026-01-01T00:00:00Z',
  });

  beforeEach(async () => {
    routeParams = new BehaviorSubject(convertToParamMap({ id: '1' }));
    requestedIds = [];
    const productService = {
      getProductById: (id: number) => {
        requestedIds.push(id);
        return id === 2
          ? throwError(() => new Error('Product unavailable'))
          : of(createProduct(id));
      },
    };

    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: routeParams.asObservable() },
        },
        { provide: ProductService, useValue: productService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetails);
    fixture.detectChanges();
  });

  it('loads and displays the product when the route ID changes', () => {
    expect(fixture.nativeElement.textContent).toContain('Product 1');

    routeParams.next(convertToParamMap({ id: '3' }));
    fixture.detectChanges();

    expect(requestedIds).toEqual([1, 3]);
    expect(fixture.nativeElement.textContent).toContain('Product 3');
    expect(fixture.nativeElement.textContent).not.toContain('Product 1');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('shows a route-specific load error and recovers when the ID changes again', () => {
    routeParams.next(convertToParamMap({ id: '2' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Unable to load product details.'
    );
    expect(fixture.componentInstance.loading()).toBe(false);

    routeParams.next(convertToParamMap({ id: '4' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Product 4');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });
});
