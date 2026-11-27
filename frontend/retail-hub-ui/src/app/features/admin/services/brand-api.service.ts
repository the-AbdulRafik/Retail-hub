
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Matches the backend BrandResponse DTO.
export interface Brand {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

// Matches the backend CreateBrandRequest DTO.
export interface CreateBrandRequest {
  name: string;
  description: string | null;
}

// Matches the backend UpdateBrandRequest DTO.
export interface UpdateBrandRequest {
  name: string;
  description: string | null;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BrandApiService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:5266/api/brands';

  // GET: Retrieve all brands.
  getBrands(includeInactive = false): Observable<Brand[]> {
    return this.http.get<Brand[]>(this.apiUrl, {
      params: { includeInactive: String(includeInactive) },
    });
  }

  // GET: Retrieve one brand by ID.
  getBrandById(id: number): Observable<Brand> {
    return this.http.get<Brand>(`${this.apiUrl}/${id}`);
  }

  // POST: Create a brand (Admin authentication required).
  createBrand(request: CreateBrandRequest): Observable<Brand> {
    return this.http.post<Brand>(this.apiUrl, request);
  }

  // PUT: Update a brand (Admin authentication required).
  updateBrand(
    id: number,
    request: UpdateBrandRequest,
  ): Observable<Brand> {
    return this.http.put<Brand>(`${this.apiUrl}/${id}`, request);
  }

  // DELETE: Deactivate a brand (Admin authentication required).
  deleteBrand(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
