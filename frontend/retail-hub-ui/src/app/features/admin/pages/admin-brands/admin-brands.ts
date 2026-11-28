import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { extractApiErrorMessage } from '../../../../core/models/api-error.models';
import {
  Brand,
  BrandApiService,
  CreateBrandRequest,
  UpdateBrandRequest,
} from '../../services/brand-api.service';

@Component({
  selector: 'app-admin-brands',
  imports: [FormsModule],
  templateUrl: './admin-brands.html',
  styleUrl: './admin-brands.css',
})
export class AdminBrands implements OnInit {
  private readonly brandApi = inject(BrandApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected searchTerm = '';
  protected includeInactive = false;
  protected brands: Brand[] = [];

  protected isLoading = false;
  protected isSaving = false;
  protected errorMessage = '';
  protected successMessage = '';

  protected isFormOpen = false;
  protected editingBrandId: number | null = null;

  protected formName = '';
  protected formDescription = '';
  protected formError = '';

  ngOnInit(): void {
    this.loadBrands();
  }

  protected get filteredBrands(): Brand[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.brands;
    }

    return this.brands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(term) ||
        (brand.description ?? '').toLowerCase().includes(term),
    );
  }

  protected loadBrands(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.brandApi
      .getBrands(this.includeInactive)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (brands) => {
          this.brands = brands;
        },
        error: (error: unknown) => {
          this.errorMessage = extractApiErrorMessage(
            error,
            'Unable to load brands. Please try again.',
          );
        },
      });
  }

  protected openCreateForm(): void {
    if (this.isSaving) {
      return;
    }

    this.editingBrandId = null;
    this.formName = '';
    this.formDescription = '';
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.isFormOpen = true;
  }

  protected openEditForm(brand: Brand): void {
    if (this.isSaving) {
      return;
    }

    this.editingBrandId = brand.id;
    this.formName = brand.name;
    this.formDescription = brand.description ?? '';
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.isFormOpen = true;
  }

  protected closeForm(): void {
    if (this.isSaving) {
      return;
    }

    this.isFormOpen = false;
    this.editingBrandId = null;
    this.formName = '';
    this.formDescription = '';
    this.formError = '';
  }

  protected saveBrand(): void {
    if (this.isSaving) {
      return;
    }

    const name = this.formName.trim();
    const description = this.formDescription.trim();

    if (!name) {
      this.formError = 'Brand name is required.';
      return;
    }

    if (name.length > 100) {
      this.formError = 'Brand name cannot exceed 100 characters.';
      return;
    }

    if (description.length > 500) {
      this.formError = 'Description cannot exceed 500 characters.';
      return;
    }

    const request: CreateBrandRequest = {
      name,
      description: description || null,
    };

    const editingId = this.editingBrandId;
    this.isSaving = true;
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';

    const operation =
      editingId === null
        ? this.brandApi.createBrand(request)
        : this.brandApi.updateBrand(editingId, {
            ...request,
            isActive:
              this.brands.find((brand) => brand.id === editingId)?.isActive ?? true,
          } satisfies UpdateBrandRequest);

    operation
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.isFormOpen = false;
          this.editingBrandId = null;
          this.formName = '';
          this.formDescription = '';
          this.successMessage =
            editingId === null
              ? 'Brand created successfully.'
              : 'Brand updated successfully.';
          this.loadBrands();
        },
        error: (error: unknown) => {
          this.formError = extractApiErrorMessage(
            error,
            'Unable to save the brand. Please try again.',
          );
        },
      });
  }

  protected reactivateBrand(brand: Brand): void {
    if (this.isSaving || brand.isActive) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.brandApi
      .updateBrand(brand.id, {
        name: brand.name,
        description: brand.description ?? null,
        isActive: true,
      })
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = `${brand.name} reactivated successfully.`;
          this.loadBrands();
        },
        error: (error: unknown) => {
          this.errorMessage = extractApiErrorMessage(
            error,
            'Unable to reactivate the brand. Please try again.',
          );
        },
      });
  }

  protected deactivateBrand(brand: Brand): void {
    if (this.isSaving || !brand.isActive) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${brand.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.brandApi
      .deleteBrand(brand.id)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = `${brand.name} deactivated successfully.`;
          this.loadBrands();
        },
        error: (error: unknown) => {
          this.errorMessage = extractApiErrorMessage(
            error,
            'Unable to deactivate the brand. Please try again.',
          );
        },
      });
  }
}
