import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  PaginatedProducts,
  Product,
  ProductFilters,
  ProductOption,
} from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5266/api';

  getProducts(filters: ProductFilters): Observable<PaginatedProducts> {
    let params = new HttpParams()
      .set('page', String(filters.page))
      .set('pageSize', String(filters.pageSize));

    if (filters.search?.trim()) params = params.set('search', filters.search.trim());
    if (filters.categoryId) params = params.set('categoryId', String(filters.categoryId));
    if (filters.brandId) params = params.set('brandId', String(filters.brandId));
    if (filters.minPrice !== undefined) params = params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice !== undefined) params = params.set('maxPrice', String(filters.maxPrice));
    if (filters.inStockOnly) params = params.set('inStockOnly', 'true');
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<PaginatedProducts>(`${this.apiUrl}/products`, { params });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  getCategories(): Observable<ProductOption[]> {
    return this.http.get<ProductOption[]>(`${this.apiUrl}/categories`);
  }

  getBrands(): Observable<ProductOption[]> {
    return this.http.get<ProductOption[]>(`${this.apiUrl}/brands`);
  }
}
