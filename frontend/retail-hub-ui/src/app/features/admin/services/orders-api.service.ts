
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Preparing'
  | 'OutForDelivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  packagingDetails: string;
  lineTotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: string;
  customerName: string;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
}

export interface OrdersQueryParameters {
  page: number;
  pageSize: number;
  search?: string;
  status?: OrderStatus;
}

export interface OrdersPaginatedResponse {
  items: Order[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

@Injectable({
  providedIn: 'root',
})
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly apiUrl = `${this.apiBaseUrl}/orders`;

  getOrders(
    query: OrdersQueryParameters,
  ): Observable<OrdersPaginatedResponse> {
    return this.http.get<OrdersPaginatedResponse>(this.apiUrl, {
      params: {
        page: String(query.page),
        pageSize: String(query.pageSize),
        search: query.search ?? '',
        ...(query.status ? { status: query.status } : {}),
      },
    });
  }

  updateOrderStatus(
    orderId: number,
    request: UpdateOrderStatusRequest,
  ): Observable<Order> {
    return this.http.patch<Order>(
      `${this.apiUrl}/${orderId}/status`,
      request,
    );
  }
}
