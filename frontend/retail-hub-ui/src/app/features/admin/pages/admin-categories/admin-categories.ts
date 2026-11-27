import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Category {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-categories',
  imports: [FormsModule],
  templateUrl: './admin-categories.html',
  styleUrl: './admin-categories.css',
})
export class AdminCategories {
  protected searchTerm = '';
  protected showForm = false;
  protected isEditing = false;
  protected selectedCategoryId: number | null = null;

  protected formData = {
    name: '',
    description: '',
  };

  protected readonly categories: Category[] = [
    { id: 1, name: 'Groceries', description: 'Everyday grocery essentials', isActive: true },
    { id: 2, name: 'Grains', description: 'Rice, wheat and other grains', isActive: true },
    { id: 3, name: 'Beverages', description: 'Drinks, juices and beverages', isActive: true },
    { id: 4, name: 'Snacks', description: 'Chips, biscuits and snacks', isActive: false },
    { id: 5, name: 'Household', description: 'Cleaning and household products', isActive: true },
  ];

  protected get filteredCategories(): Category[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.categories;
    }

    return this.categories.filter(
      (category) =>
        category.name.toLowerCase().includes(term) ||
        category.description.toLowerCase().includes(term),
    );
  }

  protected openAddForm(): void {
    this.isEditing = false;
    this.selectedCategoryId = null;
    this.formData = { name: '', description: '' };
    this.showForm = true;
  }

  protected openEditForm(category: Category): void {
    this.isEditing = true;
    this.selectedCategoryId = category.id;
    this.formData = {
      name: category.name,
      description: category.description,
    };
    this.showForm = true;
  }

  protected saveCategory(): void {
    const name = this.formData.name.trim();
    const description = this.formData.description.trim();

    if (!name) {
      return;
    }

    if (this.isEditing && this.selectedCategoryId !== null) {
      const category = this.categories.find(
        (item) => item.id === this.selectedCategoryId,
      );

      if (category) {
        category.name = name;
        category.description = description;
      }
    } else {
      const nextId =
        Math.max(0, ...this.categories.map((category) => category.id)) + 1;

      this.categories.push({
        id: nextId,
        name,
        description,
        isActive: true,
      });
    }

    this.closeForm();
  }

  protected toggleCategoryStatus(category: Category): void {
    category.isActive = !category.isActive;
  }

  protected closeForm(): void {
    this.showForm = false;
    this.selectedCategoryId = null;
  }
}