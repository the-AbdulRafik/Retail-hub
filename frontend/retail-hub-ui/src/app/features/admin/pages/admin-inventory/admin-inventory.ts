
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface InventoryItem {
  productId: number;
  productName: string;
  category: string;
  brand: string;
  stockQuantity: number;
  reorderLevel: number;
  lastUpdated: string;
}

@Component({
  selector: 'app-admin-inventory',
  imports: [FormsModule],
  templateUrl: './admin-inventory.html',
  styleUrl: './admin-inventory.css',
})
export class AdminInventory {
  protected searchTerm = '';
  protected selectedStockStatus = '';
  protected showForm = false;
  protected selectedItem: InventoryItem | null = null;
  protected updatedQuantity = '';

  protected isValidQuantity(value: string): boolean {
  const quantity = Number(value);

  return (
    value !== '' &&
    Number.isInteger(quantity) &&
    quantity >= 0
  );
}
  protected readonly inventory: InventoryItem[] = [
    {
      productId: 1,
      productName: 'Premium Basmati Rice',
      category: 'Grains',
      brand: 'FreshFarm',
      stockQuantity: 45,
      reorderLevel: 10,
      lastUpdated: '2026-11-25',
    },
    {
      productId: 2,
      productName: 'Sunflower Oil',
      category: 'Groceries',
      brand: 'DailyChoice',
      stockQuantity: 8,
      reorderLevel: 15,
      lastUpdated: '2026-11-26',
    },
    {
      productId: 3,
      productName: 'Chocolate Cookies',
      category: 'Snacks',
      brand: 'NatureBasket',
      stockQuantity: 30,
      reorderLevel: 10,
      lastUpdated: '2026-11-24',
    },
    {
      productId: 4,
      productName: 'Orange Juice',
      category: 'Beverages',
      brand: 'DailyChoice',
      stockQuantity: 0,
      reorderLevel: 12,
      lastUpdated: '2026-11-26',
    },
    {
      productId: 5,
      productName: 'Wheat Flour',
      category: 'Grains',
      brand: 'FreshFarm',
      stockQuantity: 5,
      reorderLevel: 10,
      lastUpdated: '2026-11-23',
    },
    {
      productId: 6,
      productName: 'Dishwashing Liquid',
      category: 'Household',
      brand: 'NatureBasket',
      stockQuantity: 52,
      reorderLevel: 15,
      lastUpdated: '2026-11-22',
    },
  ];

  protected get filteredInventory(): InventoryItem[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.inventory.filter((item) => {
      const matchesSearch =
        !term ||
        item.productName.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.brand.toLowerCase().includes(term);

      const matchesStatus =
        !this.selectedStockStatus ||
        this.getStockStatus(item) === this.selectedStockStatus;

      return matchesSearch && matchesStatus;
    });
  }

  protected get totalProducts(): number {
    return this.inventory.length;
  }

  protected get lowStockCount(): number {
    return this.inventory.filter(
      (item) =>
        item.stockQuantity > 0 &&
        item.stockQuantity <= item.reorderLevel,
    ).length;
  }

  protected get outOfStockCount(): number {
    return this.inventory.filter((item) => item.stockQuantity === 0).length;
  }

  protected getStockStatus(item: InventoryItem): string {
    if (item.stockQuantity === 0) {
      return 'Out of Stock';
    }

    if (item.stockQuantity <= item.reorderLevel) {
      return 'Low Stock';
    }

    return 'In Stock';
  }

  protected openUpdateForm(item: InventoryItem): void {
    this.selectedItem = item;
    this.updatedQuantity = String(item.stockQuantity);
    this.showForm = true;
  }

  protected updateStock(): void {
    const quantity = Number(this.updatedQuantity);

    if (
      !this.selectedItem ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return;
    }

    this.selectedItem.stockQuantity = quantity;
    this.selectedItem.lastUpdated = new Date().toISOString().slice(0, 10);

    this.closeForm();
  }

  protected closeForm(): void {
    this.showForm = false;
    this.selectedItem = null;
    this.updatedQuantity = '';
  }
}
