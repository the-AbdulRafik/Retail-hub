import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';
import { PaginatedResponse } from '../../../core/models/pagination.models';
import {
  CreateOrderRequest,
  OrderQuery,
  OrderResponse,
} from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  createOrder(request: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiBaseUrl}/orders`, request);
  }

  getMyOrders(query: OrderQuery): Observable<PaginatedResponse<OrderResponse>> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize));

    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return this.http.get<PaginatedResponse<OrderResponse>>(
      `${this.apiBaseUrl}/orders/my`,
      { params }
    );
  }

  getOrderById(id: number): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiBaseUrl}/orders/${id}`);
  }
}
