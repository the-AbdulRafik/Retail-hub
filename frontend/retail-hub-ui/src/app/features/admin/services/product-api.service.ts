import { PaginatedResponse } from '../../../core/models/pagination.models';

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  packagingType: string;
  packagingSize: string;
  stockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
  rowVersion: string;
  createdAt: string;
}

export interface ProductQueryParameters {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: number;
  brandId?: number;
  inStockOnly?: boolean;
  includeInactive?: boolean;
  sortBy?: string;
  sortOrder?: string;
}

export interface CreateProductRequest {
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  brandId: number;
  categoryId: number;
  packagingType: string;
  packagingSize: string;
  stockQuantity: number;
  reorderLevel: number;
}

export interface UpdateProductRequest extends CreateProductRequest {
  isActive: boolean;
  rowVersion: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly apiUrl = `${this.apiBaseUrl}/products`;

  getProducts(
    query: ProductQueryParameters,
  ): Observable<PaginatedResponse<Product>> {
    return this.http.get<PaginatedResponse<Product>>(this.apiUrl, {
      params: {
        page: String(query.page),
        pageSize: String(query.pageSize),
        search: query.search ?? '',
        categoryId: query.categoryId ? String(query.categoryId) : '',
        brandId: query.brandId ? String(query.brandId) : '',
        inStockOnly: String(query.inStockOnly ?? false),
        includeInactive: String(query.includeInactive ?? false),
        sortBy: query.sortBy ?? 'name',
        sortOrder: query.sortOrder ?? 'asc',
      },
    });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(request: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, request);
  }

  updateProduct(
    id: number,
    request: UpdateProductRequest,
  ): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, request);
  }

  deactivateProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
