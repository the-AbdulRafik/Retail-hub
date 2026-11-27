import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Brand {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-brands',
  imports: [FormsModule],
  templateUrl: './admin-brands.html',
  styleUrl: './admin-brands.css',
})
export class AdminBrands {
  protected searchTerm = '';
  protected showForm = false;
  protected isEditing = false;
  protected selectedBrandId: number | null = null;

  protected formData = {
    name: '',
    description: '',
  };

  protected readonly brands: Brand[] = [
    { id: 1, name: 'FreshFarm', description: 'Fresh groceries and farm products', isActive: true },
    { id: 2, name: 'DailyNeeds', description: 'Everyday household essentials', isActive: true },
    { id: 3, name: 'SweetTreats', description: 'Chocolates, sweets and snacks', isActive: true },
    { id: 4, name: 'GrainHouse', description: 'Rice, wheat and other grains', isActive: false },
  ];

  protected get filteredBrands(): Brand[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.brands;
    }

    return this.brands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(term) ||
        brand.description.toLowerCase().includes(term),
    );
  }

  protected openAddForm(): void {
    this.isEditing = false;
    this.selectedBrandId = null;
    this.formData = { name: '', description: '' };
    this.showForm = true;
  }

  protected openEditForm(brand: Brand): void {
    this.isEditing = true;
    this.selectedBrandId = brand.id;
    this.formData = {
      name: brand.name,
      description: brand.description,
    };
    this.showForm = true;
  }

  protected saveBrand(): void {
    const name = this.formData.name.trim();
    const description = this.formData.description.trim();

    if (!name) {
      return;
    }

    if (this.isEditing && this.selectedBrandId !== null) {
      const brand = this.brands.find((item) => item.id === this.selectedBrandId);

      if (brand) {
        brand.name = name;
        brand.description = description;
      }
    } else {
      const nextId = Math.max(0, ...this.brands.map((brand) => brand.id)) + 1;

      this.brands.push({
        id: nextId,
        name,
        description,
        isActive: true,
      });
    }

    this.closeForm();
  }

  protected toggleBrandStatus(brand: Brand): void {
    brand.isActive = !brand.isActive;
  }

  protected closeForm(): void {
    this.showForm = false;
    this.selectedBrandId = null;
  }
}