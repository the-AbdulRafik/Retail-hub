import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { PaginatedResponse } from '../../../core/models/pagination.models';

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

@Injectable({
  providedIn: 'root',
})
export class InventoryApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly apiUrl = `${this.apiBaseUrl}/inventory`;

  getInventory(
    query: InventoryQueryParameters,
  ): Observable<PaginatedResponse<InventoryItem>> {
    return this.http.get<PaginatedResponse<InventoryItem>>(this.apiUrl, {
      params: {
        page: String(query.page),
        pageSize: String(query.pageSize),
        ...(query.search ? { search: query.search } : {}),
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
