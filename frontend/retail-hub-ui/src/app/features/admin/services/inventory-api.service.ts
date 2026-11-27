
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

export interface InventoryItem {
  productId: number;
  productName: string;
  brandName: string;
  categoryName: string;
  packagingType: string;
  packagingSize: string;
  stockQuantity: number;
  reorderLevel: number;
  isLowStock: boolean;
  isActive: boolean;
  rowVersion: string;
}

export interface InventoryQueryParameters {
  page: number;
  pageSize: number;
  search?: string;
  lowStockOnly?: boolean;
}

export interface UpdateInventoryRequest {
  stockQuantity: number;
  reorderLevel: number;
  rowVersion: string;
}

export interface InventoryPaginatedResponse {
  items: InventoryItem[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class InventoryApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly apiUrl = `${this.apiBaseUrl}/inventory`;

  getInventory(
    query: InventoryQueryParameters,
  ): Observable<InventoryPaginatedResponse> {
    return this.http.get<InventoryPaginatedResponse>(this.apiUrl, {
      params: {
        page: String(query.page),
        pageSize: String(query.pageSize),
        search: query.search ?? '',
        lowStockOnly: String(query.lowStockOnly ?? false),
      },
    });
  }

  getInventoryByProductId(productId: number): Observable<InventoryItem> {
    return this.http.get<InventoryItem>(`${this.apiUrl}/${productId}`);
  }

  updateInventory(
    productId: number,
    request: UpdateInventoryRequest,
  ): Observable<InventoryItem> {
    return this.http.put<InventoryItem>(
      `${this.apiUrl}/${productId}`,
      request,
    );
  }
}
