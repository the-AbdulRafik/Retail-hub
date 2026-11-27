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

export interface ProductFilters {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'name' | 'price' | 'createdAt' | 'stockQuantity';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductOption {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}
