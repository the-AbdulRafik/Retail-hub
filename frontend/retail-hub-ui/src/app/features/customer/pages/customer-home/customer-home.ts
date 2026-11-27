import { Component, signal, computed } from '@angular/core';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  unit: string;
  badge?: string;
}

@Component({
  selector: 'app-customer-home',
  standalone: true,
  templateUrl: './customer-home.html',
  styleUrl: './customer-home.css',
})
export class CustomerHome {
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

  // Temporary product data
  products: Product[] = [
    {
      id: 1,
      name: 'Fresh Apples',
      category: 'Fruits',
      price: 120,
      originalPrice: 150,
      rating: 4.8,
      unit: '1 kg',
      badge: '20% OFF',
      image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500',
    },
    {
      id: 2,
      name: 'Fresh Milk',
      category: 'Dairy',
      price: 60,
      originalPrice: 65,
      rating: 4.7,
      unit: '1 litre',
      image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500',
    },
    {
      id: 3,
      name: 'Organic Vegetables',
      category: 'Groceries',
      price: 90,
      originalPrice: 120,
      rating: 4.6,
      unit: '500 g',
      badge: 'BESTSELLER',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500',
    },
    {
      id: 4,
      name: 'Orange Juice',
      category: 'Beverages',
      price: 110,
      originalPrice: 130,
      rating: 4.5,
      unit: '1 litre',
      image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500',
    },
    {
      id: 5,
      name: 'Potato Chips',
      category: 'Snacks',
      price: 30,
      originalPrice: 35,
      rating: 4.4,
      unit: '150 g',
      image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500',
    },
    {
      id: 6,
      name: 'Fresh Bananas',
      category: 'Fruits',
      price: 50,
      originalPrice: 60,
      rating: 4.8,
      unit: '1 dozen',
      image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=500',
    },
    {
      id: 7,
      name: 'Fresh Bread',
      category: 'Groceries',
      price: 45,
      originalPrice: 55,
      rating: 4.5,
      unit: '400 g',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
    },
    {
      id: 8,
      name: 'Cookies',
      category: 'Snacks',
      price: 80,
      originalPrice: 100,
      rating: 4.6,
      unit: '200 g',
      image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500',
    },
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
