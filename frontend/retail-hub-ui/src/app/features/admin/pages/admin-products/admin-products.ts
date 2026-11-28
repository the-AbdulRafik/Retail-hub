
import {
  ChangeDetectorRef,
  DestroyRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  debounceTime,
  finalize,
  switchMap,
  catchError,
  of,
} from 'rxjs';

import {
  Product,
  ProductApiService,
  CreateProductRequest,
  UpdateProductRequest,
} from '../../services/product-api.service';

import { Brand, BrandApiService } from '../../services/brand-api.service';
import { Category, CategoryApiService } from '../../services/category-api.service';

@Component({
  selector: 'app-admin-products',
  imports: [FormsModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
})
export class AdminProducts implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productApi = inject(ProductApiService);
  private readonly brandApi = inject(BrandApiService);
  private readonly categoryApi = inject(CategoryApiService);

  private readonly filterChanges$ = new Subject<void>();

  // Write operations are enabled with shared authentication integration.
  protected readonly canManageProducts = true;

  protected products: Product[] = [];
  protected brands: Brand[] = [];
  protected categories: Category[] = [];

  protected searchTerm = '';
  protected selectedCategory = '';
  protected selectedBrand = '';
  protected includeInactive = false;

  protected currentPage = 1;
  protected pageSize = 10;
  protected totalCount = 0;
  protected totalPages = 0;
  protected hasPreviousPage = false;
  protected hasNextPage = false;

  protected isLoading = false;
  protected isLoadingLookups = false;
  protected isSaving = false;

  protected errorMessage = '';
  protected lookupErrorMessage = '';
  protected successMessage = '';
  protected formError = '';

  protected showForm = false;
  protected isEditing = false;
  protected selectedProduct: Product | null = null;

  protected formData = {
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    brandId: '',
    categoryId: '',
    packagingType: '',
    packagingSize: '',
    stockQuantity: '0',
    reorderLevel: '10',
  };

  ngOnInit(): void {
    this.setupProductSearch();
    this.onFiltersChanged();
    this.loadDropdownData();
  }

  private setupProductSearch(): void {
    this.filterChanges$
      .pipe(
        debounceTime(350),
        switchMap(() => {
          this.isLoading = true;
          this.errorMessage = '';
          this.cdr.markForCheck();

          return this.productApi
            .getProducts({
              page: this.currentPage,
              pageSize: this.pageSize,
              search: this.searchTerm.trim() || undefined,
              categoryId: this.selectedCategory
                ? Number(this.selectedCategory)
                : undefined,
              brandId: this.selectedBrand
                ? Number(this.selectedBrand)
                : undefined,
              includeInactive: this.includeInactive,sortBy: 'name',
              sortOrder: 'asc',
            })
            .pipe(
              catchError((error) => {
                console.error('Unable to load products:', error);

                this.errorMessage =
                  error.error?.detail ||
                  error.error?.title ||
                  'Unable to load products. Please try again.';

                this.products = [];
                this.totalCount = 0;
                this.totalPages = 0;
                this.hasPreviousPage = false;
                this.hasNextPage = false;

                return of(null);
              }),
              finalize(() => {
                this.isLoading = false;
                this.cdr.markForCheck();
              }),
            );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        this.products = [...response.items];
        this.currentPage = response.currentPage;
        this.pageSize = response.pageSize;
        this.totalCount = response.totalCount;
        this.totalPages = response.totalPages;
        this.hasPreviousPage = response.hasPreviousPage;
        this.hasNextPage = response.hasNextPage;

        this.cdr.markForCheck();
      });
  }

  protected loadProducts(): void {
    this.filterChanges$.next();
  }

  protected loadDropdownData(): void {
    this.isLoadingLookups = true;
    this.lookupErrorMessage = '';

    let completedRequests = 0;

    const finishRequest = (): void => {
      completedRequests++;

      if (completedRequests === 2) {
        this.isLoadingLookups = false;
        this.cdr.markForCheck();
      }
    };

    this.brandApi.getBrands().subscribe({
      next: (brands) => {
        this.brands = brands;
        this.cdr.markForCheck();
        finishRequest();
      },
      error: (error) => {
        console.error('Unable to load brands:', error);
        this.lookupErrorMessage = 'Unable to load brand options.';
        finishRequest();
      },
    });

    this.categoryApi.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.cdr.markForCheck();
        finishRequest();
      },
      error: (error) => {
        console.error('Unable to load categories:', error);
        this.lookupErrorMessage = this.lookupErrorMessage
          ? `${this.lookupErrorMessage} Unable to load category options.`
          : 'Unable to load category options.';
        finishRequest();
      },
    });
  }

  protected onFiltersChanged(): void {
    this.currentPage = 1;
    this.loadProducts();
  }

  protected goToPreviousPage(): void {
    if (this.hasPreviousPage && !this.isLoading) {
      this.currentPage--;
      this.loadProducts();
    }
  }

  protected goToNextPage(): void {
    if (this.hasNextPage && !this.isLoading) {
      this.currentPage++;
      this.loadProducts();
    }
  }

  protected getBrandName(product: Product): string {
    return product.brandName;
  }

  protected getCategoryName(product: Product): string {
    return product.categoryName;
  }

  protected openAddForm(): void {
    if (!this.canManageProducts) {
      return;
    }

    this.isEditing = false;
    this.selectedProduct = null;
    this.formError = '';

    this.formData = {
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      brandId: '',
      categoryId: '',
      packagingType: '',
      packagingSize: '',
      stockQuantity: '0',
      reorderLevel: '10',
    };

    this.showForm = true;
  }

  protected openEditForm(product: Product): void {
    if (!this.canManageProducts) {
      return;
    }

    this.isEditing = true;
    this.selectedProduct = product;
    this.formError = '';

    this.formData = {
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      imageUrl: product.imageUrl ?? '',
      brandId: String(product.brandId),
      categoryId: String(product.categoryId),
      packagingType: product.packagingType,
      packagingSize: product.packagingSize,
      stockQuantity: String(product.stockQuantity),
      reorderLevel: String(product.reorderLevel),
    };

    this.showForm = true;
  }

  protected saveProduct(): void {
    if (!this.canManageProducts || this.isSaving) {
      return;
    }

    const name = this.formData.name.trim();
    const price = Number(this.formData.price);
    const stockQuantity = Number(this.formData.stockQuantity);
    const reorderLevel = Number(this.formData.reorderLevel);

    if (
      !name ||
      name.length > 150 ||
      !this.formData.brandId ||
      !this.formData.categoryId ||
      !this.formData.packagingType.trim() ||
      !this.formData.packagingSize.trim() ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 9999999999999999.99 ||
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0 ||
      !Number.isInteger(reorderLevel) ||
      reorderLevel < 0
    ) {
      this.formError = 'Please enter valid product details.';
      return;
    }

    const request: CreateProductRequest = {
      name,
      description: this.formData.description.trim() || null,
      price,
      imageUrl: this.formData.imageUrl.trim() || null,
      brandId: Number(this.formData.brandId),
      categoryId: Number(this.formData.categoryId),
      packagingType: this.formData.packagingType.trim(),
      packagingSize: this.formData.packagingSize.trim(),
      stockQuantity,
      reorderLevel,
    };

    this.isSaving = true;
    this.formError = '';

    if (this.isEditing && this.selectedProduct) {
      const updateRequest: UpdateProductRequest = {
        ...request,
        isActive: this.selectedProduct.isActive,
        rowVersion: this.selectedProduct.rowVersion,
      };

      this.productApi
        .updateProduct(this.selectedProduct.id, updateRequest)
        .pipe(finalize(() => (this.isSaving = false)))
        .subscribe({
          next: () => {
            this.successMessage = 'Product updated successfully.';
            this.closeForm();
            this.loadProducts();
          },
          error: (error) => {
            console.error('Unable to update product:', error);
            this.formError =
              error.error?.detail ||
              error.error?.title ||
              'Unable to update product.';
          },
        });

      return;
    }

    this.productApi
      .createProduct(request)
      .pipe(finalize(() => (this.isSaving = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Product created successfully.';
          this.closeForm();
          this.currentPage = 1;
          this.loadProducts();
        },
        error: (error) => {
          console.error('Unable to create product:', error);
          this.formError =
            error.error?.detail ||
            error.error?.title ||
            'Unable to create product.';
        },
      });
  }

  protected reactivateProduct(product: Product): void {
    if (!this.canManageProducts || this.isSaving || product.isActive) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request: UpdateProductRequest = {
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      brandId: product.brandId,
      categoryId: product.categoryId,
      packagingType: product.packagingType,
      packagingSize: product.packagingSize,
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
      isActive: true,
      rowVersion: product.rowVersion,
    };

    this.productApi
      .updateProduct(product.id, request)
      .pipe(finalize(() => {
        this.isSaving = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.successMessage = 'Product reactivated successfully.';
          this.loadProducts();
        },
        error: (error) => {
          console.error('Unable to reactivate product:', error);
          this.errorMessage =
            error.error?.detail ||
            error.error?.title ||
            'Unable to reactivate product. Please try again.';
        },
      });
  }
  protected deactivateProduct(product: Product): void {
    if (!this.canManageProducts) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.productApi.deactivateProduct(product.id).subscribe({
      next: () => {
        this.successMessage = 'Product deactivated successfully.';
        this.loadProducts();
      },
      error: (error) => {
        console.error('Unable to deactivate product:', error);
        this.errorMessage =
          error.error?.detail ||
          error.error?.title ||
          'Unable to deactivate product.';
      },
    });
  }

  protected closeForm(): void {
    this.showForm = false;
    this.selectedProduct = null;
    this.formError = '';
  }
}
