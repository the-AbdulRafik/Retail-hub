import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './customer-home.html',
  styleUrl: './customer-home.css',
})
export class CustomerHome {
  // Product service
  private readonly productService = inject(ProductService);

  // Get products from ProductService
  readonly products: Product[] = this.productService.getProducts();

  // Search and category state
  searchTerm = signal('');
  selectedCategory = signal('All');

  // Temporary cart counter
  cartCount = signal(0);
  message = signal('');

  // Product categories
  categories = [
    { name: 'All', icon: '▦' },
    { name: 'Groceries', icon: '♧' },
    { name: 'Fruits', icon: '◉' },
    { name: 'Dairy', icon: '▱' },
    { name: 'Beverages', icon: '♜' },
    { name: 'Snacks', icon: '▤' },
  ];

  // Filter products using search and category
  filteredProducts = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const category = this.selectedCategory();

    return this.products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search);

      const matchesCategory = category === 'All' || product.category === category;

      return matchesSearch && matchesCategory;
    });
  });

  // Select product category
  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  // Update search text
  updateSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.searchTerm.set(value);
  }

  // Add product to temporary cart
  addToCart(product: Product): void {
    this.cartCount.update((count) => count + 1);

    this.message.set(`${product.name} added to cart!`);

    setTimeout(() => {
      this.message.set('');
    }, 1800);
  }

  // Reset filters
  resetFilters(): void {
    this.searchTerm.set('');
    this.selectedCategory.set('All');
  }

  // Scroll to product section
  scrollToProducts(): void {
    document.getElementById('products')?.scrollIntoView({
      behavior: 'smooth',
    });
  }
}
