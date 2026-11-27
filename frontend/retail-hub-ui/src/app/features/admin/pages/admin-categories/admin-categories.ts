import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

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

  // Enable only after shared Admin authentication is integrated.
  protected readonly canManageCategories = true;

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
      .getCategories()
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
        error: (error) => {
          console.error('Failed to load categories:', error);
          this.errorMessage =
            'Unable to load categories. Please check whether the backend is running and try again.';
        },
      });
  }

  protected openAddForm(): void {
    if (!this.canManageCategories) return;

    this.isEditing = false;
    this.selectedCategoryId = null;
    this.formData = { name: '', description: '' };
    this.formError = '';
    this.successMessage = '';
    this.showForm = true;
  }

  protected openEditForm(category: Category): void {
    if (!this.canManageCategories) return;

    this.isEditing = true;
    this.selectedCategoryId = category.id;
    this.formData = {
      name: category.name,
      description: category.description ?? '',
    };
    this.formError = '';
    this.successMessage = '';
    this.showForm = true;
  }

  protected saveCategory(): void {
    if (!this.canManageCategories || this.isSaving) return;

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

    this.isSaving = true;
    this.formError = '';
    this.errorMessage = '';
    this.successMessage = '';

    const operation =
      this.selectedCategoryId === null
        ? this.categoryApi.createCategory(request)
        : this.categoryApi.updateCategory(this.selectedCategoryId, {
            ...request,
            isActive:
              this.categories.find(
                (category) => category.id === this.selectedCategoryId,
              )?.isActive ?? true,
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
          const wasEditing = this.selectedCategoryId !== null;

          this.showForm = false;
          this.selectedCategoryId = null;
          this.successMessage = wasEditing
            ? 'Category updated successfully.'
            : 'Category created successfully.';

          this.loadCategories();
        },
        error: (error) => {
          console.error('Failed to save category:', error);
          this.formError =
            'Unable to save the category. Admin authentication is required.';
        },
      });
  }

  protected deactivateCategory(category: Category): void {
    if (!this.canManageCategories || this.isSaving) return;

    const confirmed = window.confirm(
      'Are you sure you want to deactivate "' + category.name + '"?',
    );

    if (!confirmed) return;

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
          this.successMessage =
            category.name + ' deactivated successfully.';
          this.loadCategories();
        },
        error: (error) => {
          console.error('Failed to deactivate category:', error);
          this.errorMessage =
            'Unable to deactivate the category. Admin authentication is required.';
        },
      });
  }

  protected closeForm(): void {
    if (this.isSaving) return;

    this.showForm = false;
    this.selectedCategoryId = null;
    this.formError = '';
  }
}
