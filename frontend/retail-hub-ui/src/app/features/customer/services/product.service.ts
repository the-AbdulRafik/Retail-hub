import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { PaginatedResponse } from '../../../core/models/pagination.models';
import {
  Product,
  ProductFilters,
  ProductOption,
} from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  getProducts(filters: ProductFilters): Observable<PaginatedResponse<Product>> {
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

    return this.http.get<PaginatedResponse<Product>>(`${this.apiBaseUrl}/products`, { params });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiBaseUrl}/products/${id}`);
  }

  getCategories(): Observable<ProductOption[]> {
    return this.http.get<ProductOption[]>(`${this.apiBaseUrl}/categories`);
  }

  getBrands(): Observable<ProductOption[]> {
    return this.http.get<ProductOption[]>(`${this.apiBaseUrl}/brands`);
  }
}
