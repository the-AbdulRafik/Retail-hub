
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api.config';

export interface Category {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description: string | null;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string | null;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryApiService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly apiUrl = `${this.apiBaseUrl}/categories`;

  getCategories(includeInactive = false): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl, {
      params: { includeInactive: String(includeInactive) },
    });
  }

  getCategoryById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  createCategory(request: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, request);
  }

  updateCategory(
    id: number,
    request: UpdateCategoryRequest,
  ): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, request);
  }

  deactivateCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
