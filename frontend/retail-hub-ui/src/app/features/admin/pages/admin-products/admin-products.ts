
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  brandId: number;
  categoryId: number;
  packagingType: string;
  packagingSize: string;
  stockQuantity: number;
  reorderLevel: number;
  isActive: boolean;
}

@Component({
  selector: 'app-admin-products',
  imports: [FormsModule],
  templateUrl: './admin-products.html',
  styleUrl: './admin-products.css',
})
export class AdminProducts {
  protected searchTerm = '';
  protected selectedCategory = '';
  protected selectedBrand = '';
  protected showForm = false;
  protected isEditing = false;
  protected selectedProductId: number | null = null;

  protected formData = {
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    brandId: '',
    categoryId: '',
    packagingType: '',
    packagingSize: '',
    stockQuantity: '',
    reorderLevel: '',
  };

  protected readonly brands = [
    { id: 1, name: 'FreshFarm' },
    { id: 2, name: 'DailyChoice' },
    { id: 3, name: 'NatureBasket' },
  ];

  protected readonly categories = [
    { id: 1, name: 'Groceries' },
    { id: 2, name: 'Grains' },
    { id: 3, name: 'Beverages' },
    { id: 4, name: 'Snacks' },
    { id: 5, name: 'Household' },
  ];

  protected readonly products: Product[] = [
    {
      id: 1,
      name: 'Premium Basmati Rice',
      description: 'Long grain premium basmati rice',
      price: 180,
      imageUrl: '',
      brandId: 1,
      categoryId: 2,
      packagingType: 'Pouch',
      packagingSize: '1 kg',
      stockQuantity: 45,
      reorderLevel: 10,
      isActive: true,
    },
    {
      id: 2,
      name: 'Sunflower Oil',
      description: 'Refined sunflower cooking oil',
      price: 145,
      imageUrl: '',
      brandId: 2,
      categoryId: 1,
      packagingType: 'Bottle',
      packagingSize: '1 L',
      stockQuantity: 8,
      reorderLevel: 15,
      isActive: true,
    },
    {
      id: 3,
      name: 'Chocolate Cookies',
      description: 'Crunchy chocolate cookies',
      price: 60,
      imageUrl: '',
      brandId: 3,
      categoryId: 4,
      packagingType: 'Packet',
      packagingSize: '200 g',
      stockQuantity: 30,
      reorderLevel: 10,
      isActive: true,
    },
    {
      id: 4,
      name: 'Orange Juice',
      description: 'Refreshing orange fruit drink',
      price: 95,
      imageUrl: '',
      brandId: 2,
      categoryId: 3,
      packagingType: 'Bottle',
      packagingSize: '500 ml',
      stockQuantity: 0,
      reorderLevel: 12,
      isActive: false,
    },
  ];

  protected get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term);

      const matchesCategory =
        !this.selectedCategory ||
        product.categoryId === Number(this.selectedCategory);

      const matchesBrand =
        !this.selectedBrand ||
        product.brandId === Number(this.selectedBrand);

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }

  protected getBrandName(brandId: number): string {
    return this.brands.find((brand) => brand.id === brandId)?.name ?? 'Unknown';
  }

  protected getCategoryName(categoryId: number): string {
    return (
      this.categories.find((category) => category.id === categoryId)?.name ??
      'Unknown'
    );
  }

  protected openAddForm(): void {
    this.isEditing = false;
    this.selectedProductId = null;
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
    this.isEditing = true;
    this.selectedProductId = product.id;

    this.formData = {
      name: product.name,
      description: product.description,
      price: String(product.price),
      imageUrl: product.imageUrl,
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
    const name = this.formData.name.trim();
    const price = Number(this.formData.price);
    const stockQuantity = Number(this.formData.stockQuantity);
    const reorderLevel = Number(this.formData.reorderLevel);

    if (
      !name ||
      !this.formData.brandId ||
      !this.formData.categoryId ||
      !this.formData.packagingType.trim() ||
      !this.formData.packagingSize.trim() ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isInteger(stockQuantity) ||
      stockQuantity < 0 ||
      !Number.isInteger(reorderLevel) ||
      reorderLevel < 0
    ) {
      return;
    }

    const productData = {
      name,
      description: this.formData.description.trim(),
      price,
      imageUrl: this.formData.imageUrl.trim(),
      brandId: Number(this.formData.brandId),
      categoryId: Number(this.formData.categoryId),
      packagingType: this.formData.packagingType.trim(),
      packagingSize: this.formData.packagingSize.trim(),
      stockQuantity,
      reorderLevel,
    };

    if (this.isEditing && this.selectedProductId !== null) {
      const product = this.products.find(
        (item) => item.id === this.selectedProductId,
      );

      if (product) {
        Object.assign(product, productData);
      }
    } else {
      const nextId =
        Math.max(0, ...this.products.map((product) => product.id)) + 1;

      this.products.push({
        id: nextId,
        ...productData,
        isActive: true,
      });
    }

    this.closeForm();
  }

  protected toggleProductStatus(product: Product): void {
    product.isActive = !product.isActive;
  }

  protected closeForm(): void {
    this.showForm = false;
    this.selectedProductId = null;
  }
}
