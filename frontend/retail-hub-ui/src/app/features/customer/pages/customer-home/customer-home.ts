import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { PaginatedProducts, Product, ProductOption } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './customer-home.html',
  styleUrl: './customer-home.css',
})
export class CustomerHome {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchInput = new Subject<string>();

  readonly products = signal<Product[]>([]);
  readonly categories = signal<ProductOption[]>([]);
  readonly brands = signal<ProductOption[]>([]);
  readonly searchTerm = signal('');
  readonly selectedCategory = signal<number | null>(null);
  readonly selectedBrand = signal<number | null>(null);
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

  constructor() {
    this.loadOptions();
    this.loadProducts();

    this.searchInput
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => {
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
    this.searchTerm.set('');
    this.selectedCategory.set(null);
    this.selectedBrand.set(null);
    this.inStockOnly.set(false);
    this.sortBy.set('name');
    this.sortOrder.set('asc');
    this.page.set(1);
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.page.set(1);
    this.loadProducts();
  }

  private loadOptions(): void {
    this.productService.getCategories().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (categories) => this.categories.set(categories),
      error: () => this.categories.set([]),
    });
    this.productService.getBrands().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (brands) => this.brands.set(brands),
      error: () => this.brands.set([]),
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.productService.getProducts({
      page: this.page(),
      pageSize: this.pageSize,
      search: this.searchTerm(),
      categoryId: this.selectedCategory() ?? undefined,
      brandId: this.selectedBrand() ?? undefined,
      inStockOnly: this.inStockOnly(),
      sortBy: this.sortBy(),
      sortOrder: this.sortOrder(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response: PaginatedProducts) => {
        this.products.set(response.items);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
        this.hasPreviousPage.set(response.hasPreviousPage);
        this.hasNextPage.set(response.hasNextPage);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.products.set([]);
        this.loading.set(false);
        this.errorMessage.set(error.error?.detail ?? 'Unable to load products. Please try again.');
      },
    });
  }

  scrollToProducts(): void {
    document.getElementById('products')?.scrollIntoView({
      behavior: 'smooth',
    });
  }
}
