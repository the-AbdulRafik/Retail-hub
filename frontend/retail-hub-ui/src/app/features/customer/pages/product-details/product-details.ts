import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  readonly quantity = signal(1);
  readonly message = signal('');

  readonly product = computed(() => {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      return undefined;
    }

    return this.productService.getProductById(id);
  });

  increaseQuantity(): void {
    this.quantity.update((value) => value + 1);
  }

  decreaseQuantity(): void {
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  getDiscountPercentage(price: number, originalPrice: number): number {
    if (originalPrice <= price || originalPrice <= 0) {
      return 0;
    }

    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }

  addToCart(): void {
    const product = this.product();

    if (!product) {
      return;
    }

    // Temporary feedback.
    // Full cart functionality will be implemented in Feature 3.
    this.message.set(`${this.quantity()} ${product.unit} of ${product.name} selected.`);
  }
}
