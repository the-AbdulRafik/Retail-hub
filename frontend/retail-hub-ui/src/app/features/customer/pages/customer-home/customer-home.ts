import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  tap,
} from 'rxjs';
import { extractApiErrorMessage } from '../../../../core/models/api-error.models';
import { PaginatedResponse } from '../../../../core/models/pagination.models';
import { CartService } from '../../../../core/services/cart.service';
import { Product, ProductOption } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './customer-home.html',
  styleUrl: './customer-home.css',
})
export class CustomerHome {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchInput = new Subject<string>();
  private readonly productRequests = new Subject<void>();

  readonly cartItemCount = this.cartService.itemCount;
  readonly products = signal<readonly Product[]>([]);
  readonly failedImageIds = signal<ReadonlySet<number>>(new Set());
  readonly categories = signal<ProductOption[]>([]);
  readonly brands = signal<ProductOption[]>([]);
  readonly searchTerm = signal('');
  readonly selectedCategory = signal<number | null>(null);
  readonly selectedBrand = signal<number | null>(null);
  readonly minPriceInput = signal('');
  readonly maxPriceInput = signal('');
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);
  readonly priceFilterError = signal('');
  readonly inStockOnly = signal(false);
  readonly sortBy = signal<'name' | 'price' | 'createdAt' | 'stockQuantity'>('name');
  readonly sortOrder = signal<'asc' | 'desc'>('asc');
  readonly page = signal(1);
  readonly pageSize = 12;
  readonly totalCount = signal(0);
  readonly totalPages = signal(0);
  readonly hasPreviousPage = signal(false);
  readonly hasNextPage = signal(false);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly categoryError = signal('');
  readonly brandError = signal('');

  constructor() {
    this.loadOptions();

    this.productRequests
      .pipe(
        switchMap(() =>
          this.productService
            .getProducts({
              page: this.page(),
              pageSize: this.pageSize,
              search: this.searchTerm(),
              categoryId: this.selectedCategory() ?? undefined,
              brandId: this.selectedBrand() ?? undefined,
              minPrice: this.minPrice() ?? undefined,
              maxPrice: this.maxPrice() ?? undefined,
              inStockOnly: this.inStockOnly(),
              sortBy: this.sortBy(),
              sortOrder: this.sortOrder(),
            })
            .pipe(
              tap((response: PaginatedResponse<Product>) => {
                this.products.set(response.items);
                this.failedImageIds.set(new Set());
                this.totalCount.set(response.totalCount);
                this.totalPages.set(response.totalPages);
                this.hasPreviousPage.set(response.hasPreviousPage);
                this.hasNextPage.set(response.hasNextPage);
                this.loading.set(false);
              }),
              catchError((error: unknown) => {
                this.products.set([]);
                this.loading.set(false);
                this.errorMessage.set(
                  extractApiErrorMessage(error, 'Unable to load products. Please try again.'),
                );
                return EMPTY;
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.searchInput
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => {
        if (search === this.searchTerm()) return;
        this.searchTerm.set(search);
        this.page.set(1);
        this.loadProducts();
      });
  }

  selectCategory(categoryId: number | null): void {
    this.selectedCategory.set(categoryId);
    this.page.set(1);
    this.loadProducts();
  }

  selectBrand(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedBrand.set(value ? Number(value) : null);
    this.page.set(1);
    this.loadProducts();
  }

  updateMinPrice(event: Event): void {
    this.minPriceInput.set((event.target as HTMLInputElement).value);
  }

  updateMaxPrice(event: Event): void {
    this.maxPriceInput.set((event.target as HTMLInputElement).value);
  }

  applyPriceFilter(): void {
    const minText = this.minPriceInput().trim();
    const maxText = this.maxPriceInput().trim();
    const min = minText === '' ? null : Number(minText);
    const max = maxText === '' ? null : Number(maxText);

    if (
      (min !== null && (!Number.isFinite(min) || min < 0 || min > 999999.99)) ||
      (max !== null && (!Number.isFinite(max) || max < 0 || max > 999999.99))
    ) {
      this.priceFilterError.set('Prices must be between 0 and 999999.99.');
      return;
    }

    if (min !== null && max !== null && min > max) {
      this.priceFilterError.set('Minimum price must not exceed maximum price.');
      return;
    }

    this.priceFilterError.set('');
    this.minPrice.set(min);
    this.maxPrice.set(max);
    this.page.set(1);
    this.loadProducts();
  }

  updateSearch(event: Event): void {
    this.searchInput.next((event.target as HTMLInputElement).value);
  }

  toggleInStock(event: Event): void {
    this.inStockOnly.set((event.target as HTMLInputElement).checked);
    this.page.set(1);
    this.loadProducts();
  }

  updateSort(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const [sortBy, sortOrder] = value.split(':');
    this.sortBy.set(sortBy as 'name' | 'price' | 'createdAt' | 'stockQuantity');
    this.sortOrder.set(sortOrder as 'asc' | 'desc');
    this.page.set(1);
    this.loadProducts();
  }

  changePage(page: number): void {
    if (page < 1 || page === this.page()) return;
    this.page.set(page);
    this.loadProducts();
  }

  resetFilters(): void {
    this.searchInput.next('');
    this.searchTerm.set('');
    this.selectedCategory.set(null);
    this.selectedBrand.set(null);
    this.minPriceInput.set('');
    this.maxPriceInput.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.priceFilterError.set('');
    this.inStockOnly.set(false);
    this.sortBy.set('name');
    this.sortOrder.set('asc');
    this.page.set(1);
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchInput.next('');
    this.searchTerm.set('');
    this.page.set(1);
    this.loadProducts();
  }

  private loadOptions(): void {
    this.productService
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: (error: unknown) => {
          this.categories.set([]);
          this.categoryError.set(extractApiErrorMessage(error, 'Unable to load categories.'));
        },
      });
    this.productService
      .getBrands()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (brands) => this.brands.set(brands),
        error: (error: unknown) => {
          this.brands.set([]);
          this.brandError.set(extractApiErrorMessage(error, 'Unable to load brands.'));
        },
      });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.productRequests.next();
  }

  scrollToProducts(): void {
    document.getElementById('products')?.scrollIntoView({
      behavior: 'smooth',
    });
  }

  markImageFailed(productId: number): void {
    this.failedImageIds.update((failedIds) => new Set(failedIds).add(productId));
  }
}
