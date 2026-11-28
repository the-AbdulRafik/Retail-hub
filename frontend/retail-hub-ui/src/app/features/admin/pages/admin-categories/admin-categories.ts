import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { extractApiErrorMessage } from '../../../../core/models/api-error.models';
import {
  Category,
  CategoryApiService,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../services/category-api.service';

@Component({
  selector: 'app-admin-categories',
  imports: [FormsModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css',
})
export class AdminCategories implements OnInit {
  private readonly categoryApi = inject(CategoryApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  protected searchTerm = '';
  protected includeInactive = false;
  protected categories: Category[] = [];

  protected isLoading = false;
  protected isSaving = false;

  protected errorMessage = '';
  protected successMessage = '';
  protected formError = '';

  protected showForm = false;
  protected isEditing = false;
  protected selectedCategoryId: number | null = null;

  protected formData = {
    name: '',
    description: '',
  };

  ngOnInit(): void {
    this.loadCategories();
  }

  protected get filteredCategories(): Category[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.categories;
    }

    return this.categories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        (category.description ?? '').toLowerCase().includes(term),
    );
  }

  protected loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.categoryApi
      .getCategories(this.includeInactive)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: (categories) => {
          this.categories = categories;
        },
        error: (error: unknown) => {
          this.errorMessage = extractApiErrorMessage(
            error,
            'Unable to load categories. Please try again.',
          );
        },
      });
  }

  protected openAddForm(): void {
    if (this.isSaving) {
      return;
    }

    this.isEditing = false;
    this.selectedCategoryId = null;
    this.formData = { name: '', description: '' };
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showForm = true;
  }

  protected openEditForm(category: Category): void {
    if (this.isSaving) {
      return;
    }

    this.isEditing = true;
    this.selectedCategoryId = category.id;
    this.formData = {
      name: category.name,
      description: category.description ?? '',
    };
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';
    this.showForm = true;
  }

  protected saveCategory(): void {
    if (this.isSaving) {
      return;
    }

    const name = this.formData.name.trim();
    const description = this.formData.description.trim();

    if (!name) {
      this.formError = 'Category name is required.';
      return;
    }

    if (name.length > 100) {
      this.formError = 'Category name cannot exceed 100 characters.';
      return;
    }

    if (description.length > 500) {
      this.formError = 'Description cannot exceed 500 characters.';
      return;
    }

    const request: CreateCategoryRequest = {
      name,
      description: description || null,
    };

    const editingId = this.selectedCategoryId;
    this.isSaving = true;
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';

    const operation =
      editingId === null
        ? this.categoryApi.createCategory(request)
        : this.categoryApi.updateCategory(editingId, {
            ...request,
            isActive:
              this.categories.find((category) => category.id === editingId)
                ?.isActive ?? true,
          } satisfies UpdateCategoryRequest);

    operation
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.showForm = false;
          this.isEditing = false;
          this.selectedCategoryId = null;
          this.formData = { name: '', description: '' };
          this.successMessage =
            editingId !== null
              ? 'Category updated successfully.'
              : 'Category created successfully.';

          this.loadCategories();
        },
        error: (error: unknown) => {
          this.formError = extractApiErrorMessage(
            error,
            'Unable to save the category. Please try again.',
          );
        },
      });
  }

  protected reactivateCategory(category: Category): void {
    if (this.isSaving || category.isActive) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.categoryApi
      .updateCategory(category.id, {
        name: category.name,
        description: category.description ?? null,
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
          this.successMessage = `${category.name} reactivated successfully.`;
          this.loadCategories();
        },
        error: (error: unknown) => {
          this.errorMessage = extractApiErrorMessage(
            error,
            'Unable to reactivate the category. Please try again.',
          );
        },
      });
  }

  protected deactivateCategory(category: Category): void {
    if (this.isSaving || !category.isActive) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${category.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.categoryApi
      .deactivateCategory(category.id)
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = `${category.name} deactivated successfully.`;
          this.loadCategories();
        },
        error: (error: unknown) => {
          this.errorMessage = extractApiErrorMessage(
            error,
            'Unable to deactivate the category. Please try again.',
          );
        },
      });
  }

  protected closeForm(): void {
    if (this.isSaving) {
      return;
    }

    this.showForm = false;
    this.isEditing = false;
    this.selectedCategoryId = null;
    this.formData = { name: '', description: '' };
    this.formError = '';
  }
}
