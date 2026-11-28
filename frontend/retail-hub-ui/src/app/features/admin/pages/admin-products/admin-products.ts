import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  catchError,
  debounceTime,
  finalize,
  forkJoin,
  merge,
  of,
  switchMap,
} from 'rxjs';
import { extractApiErrorMessage } from '../../../../core/models/api-error.models';
import { Brand, BrandApiService } from '../../services/brand-api.service';
import { Category, CategoryApiService } from '../../services/category-api.service';
import {
  CreateProductRequest,
  Product,
  ProductApiService,
  UpdateProductRequest,
} from '../../services/product-api.service';

const MAX_SAFE_DECIMAL_PRICE = 999999999999.99;

interface ProductFormState {
  name: string;
  description: string;
  price: number | null;
  imageUrl: string;
  brandId: string;
  categoryId: string;
  packagingType: string;
  packagingSize: string;
  stockQuantity: number | null;
  reorderLevel: number | null;
}

@Component({
  selector: 'app-admin-products',
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
})
export class AdminProducts implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productApi = inject(ProductApiService);
  private readonly brandApi = inject(BrandApiService);
  private readonly categoryApi = inject(CategoryApiService);

  private readonly debouncedFilter$ = new Subject<void>();
  private readonly immediateLoad$ = new Subject<void>();

  protected products: Product[] = [];
  protected brands: Brand[] = [];
  protected categories: Category[] = [];

  protected searchTerm = '';
  protected selectedCategory = '';
  protected selectedBrand = '';
  protected packagingType = '';
  protected minPrice: number | null = null;
  protected maxPrice: number | null = null;
  protected includeInactive = false;
  protected sortBy = 'name';
  protected sortOrder = 'asc';

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
  protected filterError = '';
  protected lookupErrorMessage = '';
  protected successMessage = '';
  protected formError = '';

  protected showForm = false;
  protected isEditing = false;
  protected selectedProduct: Product | null = null;

  protected formData: ProductFormState = this.createEmptyFormData();

  ngOnInit(): void {
    this.setupProductPipeline();
    this.loadDropdownData();
    this.triggerImmediateLoad();
  }

  protected get inactiveReferenceWarning(): string {
    if (!this.showForm) {
      return '';
    }

    const warnings: string[] = [];
    const selectedBrand = this.brands.find((b) => String(b.id) === this.formData.brandId);
    const selectedCategory = this.categories.find(
      (c) => String(c.id) === this.formData.categoryId,
    );

    if (selectedBrand && !selectedBrand.isActive) {
      warnings.push(`Brand "${selectedBrand.name}" is inactive`);
    }

    if (selectedCategory && !selectedCategory.isActive) {
      warnings.push(`Category "${selectedCategory.name}" is inactive`);
    }

    if (warnings.length === 0) {
      return '';
    }

    return `${warnings.join(' and ')}. Select an active brand and category before saving.`;
  }

  private setupProductPipeline(): void {
    merge(
      this.debouncedFilter$.pipe(debounceTime(350)),
      this.immediateLoad$,
    )
      .pipe(
        switchMap(() => {
          if (!this.validatePriceFilters()) {
            this.isLoading = false;
            this.cdr.markForCheck();
            return of(null);
          }

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
              packagingType: this.packagingType.trim() || undefined,
              minPrice: this.normalizeOptionalNumber(this.minPrice),
              maxPrice: this.normalizeOptionalNumber(this.maxPrice),
              includeInactive: this.includeInactive,
              sortBy: this.sortBy,
              sortOrder: this.sortOrder,
            })
            .pipe(
              catchError((error: unknown) => {
                this.errorMessage = extractApiErrorMessage(
                  error,
                  'Unable to load products. Please try again.',
                );
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
    this.triggerImmediateLoad();
  }

  protected loadDropdownData(): void {
    this.isLoadingLookups = true;
    this.lookupErrorMessage = '';

    forkJoin({
      brands: this.brandApi.getBrands(true),
      categories: this.categoryApi.getCategories(true),
    })
      .pipe(
        finalize(() => {
          this.isLoadingLookups = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ brands, categories }) => {
          this.brands = brands;
          this.categories = categories;
        },
        error: (error: unknown) => {
          this.lookupErrorMessage = extractApiErrorMessage(
            error,
            'Unable to load brand and category options.',
          );
        },
      });
  }

  protected onSearchInputChanged(): void {
    this.currentPage = 1;
    this.debouncedFilter$.next();
  }

  protected onImmediateFilterChanged(): void {
    this.currentPage = 1;
    this.triggerImmediateLoad();
  }

  protected goToPreviousPage(): void {
    if (this.hasPreviousPage && !this.isLoading) {
      this.currentPage--;
      this.triggerImmediateLoad();
    }
  }

  protected goToNextPage(): void {
    if (this.hasNextPage && !this.isLoading) {
      this.currentPage++;
      this.triggerImmediateLoad();
    }
  }

  protected openAddForm(): void {
    if (this.isSaving) {
      return;
    }

    this.isEditing = false;
    this.selectedProduct = null;
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.formData = this.createEmptyFormData();
    this.showForm = true;
    this.cdr.markForCheck();
  }

  protected openEditForm(product: Product): void {
    if (this.isSaving) {
      return;
    }

    this.isEditing = true;
    this.selectedProduct = product;
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';

    this.formData = {
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      imageUrl: product.imageUrl ?? '',
      brandId: String(product.brandId),
      categoryId: String(product.categoryId),
      packagingType: product.packagingType,
      packagingSize: product.packagingSize,
      stockQuantity: product.stockQuantity,
      reorderLevel: product.reorderLevel,
    };

    this.showForm = true;
    this.cdr.markForCheck();
  }

  protected saveProduct(): void {
    if (this.isSaving) {
      return;
    }

    const validationError = this.validateProductForm();
    if (validationError) {
      this.formError = validationError;
      this.cdr.markForCheck();
      return;
    }

    const request: CreateProductRequest = {
      name: this.formData.name.trim(),
      description: this.formData.description.trim() || null,
      price: Number(this.formData.price),
      imageUrl: this.formData.imageUrl.trim() || null,
      brandId: Number(this.formData.brandId),
      categoryId: Number(this.formData.categoryId),
      packagingType: this.formData.packagingType.trim(),
      packagingSize: this.formData.packagingSize.trim(),
      stockQuantity: Number(this.formData.stockQuantity),
      reorderLevel: Number(this.formData.reorderLevel),
    };

    this.isSaving = true;
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    if (this.isEditing && this.selectedProduct) {
      const updateRequest: UpdateProductRequest = {
        ...request,
        isActive: this.selectedProduct.isActive,
        rowVersion: this.selectedProduct.rowVersion,
      };

      this.productApi
        .updateProduct(this.selectedProduct.id, updateRequest)
        .pipe(
          finalize(() => {
            this.isSaving = false;
            this.cdr.markForCheck();
          }),
        )
        .subscribe({
          next: () => {
            this.successMessage = 'Product updated successfully.';
            this.resetFormState();
            this.triggerImmediateLoad();
          },
          error: (error: unknown) => {
            this.formError = extractApiErrorMessage(
              error,
              'Unable to update product.',
            );
            this.cdr.markForCheck();
          },
        });

      return;
    }

    this.productApi
      .createProduct(request)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Product created successfully.';
          this.resetFormState();
          this.currentPage = 1;
          this.triggerImmediateLoad();
        },
        error: (error: unknown) => {
          this.formError = extractApiErrorMessage(
            error,
            'Unable to create product.',
          );
          this.cdr.markForCheck();
        },
      });
  }

  protected reactivateProduct(product: Product): void {
    if (this.isSaving || product.isActive) {
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
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Product reactivated successfully.';
          this.triggerImmediateLoad();
        },
        error: (error: unknown) => {
          this.errorMessage = extractApiErrorMessage(
            error,
            'Unable to reactivate product. Please try again.',
          );
        },
      });
  }

  protected deactivateProduct(product: Product): void {
    if (this.isSaving || !product.isActive) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${product.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.productApi
      .deactivateProduct(product.id)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Product deactivated successfully.';
          this.triggerImmediateLoad();
        },
        error: (error: unknown) => {
          this.errorMessage = extractApiErrorMessage(
            error,
            'Unable to deactivate product.',
          );
        },
      });
  }

  protected closeForm(): void {
    if (this.isSaving) {
      return;
    }

    this.resetFormState();
  }

  private resetFormState(): void {
    this.showForm = false;
    this.isEditing = false;
    this.selectedProduct = null;
    this.formData = this.createEmptyFormData();
    this.formError = '';
    this.cdr.markForCheck();
  }

  private triggerImmediateLoad(): void {
    this.immediateLoad$.next();
  }

  private validatePriceFilters(): boolean {
    const min = this.normalizeOptionalNumber(this.minPrice);
    const max = this.normalizeOptionalNumber(this.maxPrice);

    if (min !== undefined && min < 0) {
      this.filterError = 'Minimum price cannot be negative.';
      return false;
    }

    if (max !== undefined && max < 0) {
      this.filterError = 'Maximum price cannot be negative.';
      return false;
    }

    if (min !== undefined && max !== undefined && min > max) {
      this.filterError = 'Minimum price cannot be greater than maximum price.';
      return false;
    }

    this.filterError = '';
    return true;
  }

  private validateProductForm(): string | null {
    const name = this.formData.name.trim();
    const description = this.formData.description.trim();
    const imageUrl = this.formData.imageUrl.trim();
    const packagingType = this.formData.packagingType.trim();
    const packagingSize = this.formData.packagingSize.trim();

    if (!name) {
      return 'Product name is required.';
    }

    if (name.length > 150) {
      return 'Product name cannot exceed 150 characters.';
    }

    if (description.length > 1000) {
      return 'Description cannot exceed 1000 characters.';
    }

    if (!this.isProvidedNumber(this.formData.price)) {
      return 'Price is required.';
    }

    const price = Number(this.formData.price);
    if (!Number.isFinite(price) || price < 0 || price > MAX_SAFE_DECIMAL_PRICE) {
      return `Price must be between 0 and ${MAX_SAFE_DECIMAL_PRICE}.`;
    }

    if (imageUrl.length > 500) {
      return 'Image URL cannot exceed 500 characters.';
    }

    if (imageUrl && !this.isValidHttpUrl(imageUrl)) {
      return 'Image URL must be a valid http or https URL.';
    }

    if (!this.formData.brandId) {
      return 'Please select a brand.';
    }

    if (!this.formData.categoryId) {
      return 'Please select a category.';
    }

    if (this.inactiveReferenceWarning) {
      return this.inactiveReferenceWarning;
    }

    if (!packagingType || packagingType.length > 60) {
      return 'Packaging type is required (max 60 characters).';
    }

    if (!packagingSize || packagingSize.length > 60) {
      return 'Packaging size is required (max 60 characters).';
    }

    if (!this.isProvidedNumber(this.formData.stockQuantity)) {
      return 'Stock quantity is required.';
    }

    const stockQuantity = Number(this.formData.stockQuantity);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      return 'Stock quantity must be a non-negative whole number.';
    }

    if (!this.isProvidedNumber(this.formData.reorderLevel)) {
      return 'Reorder level is required.';
    }

    const reorderLevel = Number(this.formData.reorderLevel);
    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
      return 'Reorder level must be a non-negative whole number.';
    }

    return null;
  }

  private isProvidedNumber(value: number | string | null | undefined): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    return String(value).trim() !== '';
  }

  private normalizeOptionalNumber(value: number | string | null | undefined): number | undefined {
    if (!this.isProvidedNumber(value)) {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private isValidHttpUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private createEmptyFormData(): ProductFormState {
    return {
      name: '',
      description: '',
      price: null,
      imageUrl: '',
      brandId: '',
      categoryId: '',
      packagingType: '',
      packagingSize: '',
      stockQuantity: 0,
      reorderLevel: 10,
    };
  }
}
