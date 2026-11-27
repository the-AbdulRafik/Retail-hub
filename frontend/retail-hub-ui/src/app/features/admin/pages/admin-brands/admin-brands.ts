
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

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

  // Write operations remain disabled until shared authentication is available.
  protected readonly canManageBrands = false;

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
      .getBrands()
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
        error: (error) => {
          console.error('Failed to load brands:', error);
          this.errorMessage =
            'Unable to load brands. Please check whether the backend is running and try again.';
        },
      });
  }

  protected openCreateForm(): void {
    if (!this.canManageBrands) return;

    this.editingBrandId = null;
    this.formName = '';
    this.formDescription = '';
    this.formError = '';
    this.successMessage = '';
    this.isFormOpen = true;
  }

  protected openEditForm(brand: Brand): void {
    if (!this.canManageBrands) return;

    this.editingBrandId = brand.id;
    this.formName = brand.name;
    this.formDescription = brand.description ?? '';
    this.formError = '';
    this.successMessage = '';
    this.isFormOpen = true;
  }

  protected closeForm(): void {
    if (this.isSaving) return;

    this.isFormOpen = false;
    this.editingBrandId = null;
    this.formError = '';
  }

  protected saveBrand(): void {
    if (!this.canManageBrands || this.isSaving) return;

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

    this.isSaving = true;
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';

    const operation =
      this.editingBrandId === null
        ? this.brandApi.createBrand(request)
        : this.brandApi.updateBrand(this.editingBrandId, {
            ...request,
            isActive: true,
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
          this.successMessage =
            this.editingBrandId === null
              ? 'Brand created successfully.'
              : 'Brand updated successfully.';

          this.editingBrandId = null;
          this.loadBrands();
        },
        error: (error) => {
          console.error('Failed to save brand:', error);
          this.formError =
            'Unable to save the brand. Please try again when Admin authentication is available.';
        },
      });
  }

  protected deactivateBrand(brand: Brand): void {
    if (!this.canManageBrands || this.isSaving) return;

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${brand.name}"?`,
    );

    if (!confirmed) return;

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
        error: (error) => {
          console.error('Failed to deactivate brand:', error);
          this.errorMessage =
            'Unable to deactivate the brand. Admin authentication is required.';
        },
      });
  }
}
