import { HttpErrorResponse } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);

  readonly quantity = signal(1);
  readonly message = signal('');
  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id <= 0) {
      this.loading.set(false);
      this.errorMessage.set('The product link is invalid.');
      return;
    }

    this.loadProduct(id);
  }

  increaseQuantity(): void {
    const product = this.product();
    if (!product) return;
    this.quantity.update((value) => Math.min(product.stockQuantity, value + 1));
  }

  decreaseQuantity(): void {
    if (this.product()?.stockQuantity === 0) return;
    this.quantity.update((value) => Math.max(1, value - 1));
  }

  addToCart(): void {
    const product = this.product();
    if (!product || product.stockQuantity < 1) return;
    this.message.set('Unable to add this product: the shared cart service is not available yet.');
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.productService.getProductById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (product) => {
        this.product.set(product);
        this.quantity.set(product.stockQuantity > 0 ? 1 : 0);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.detail ?? 'Unable to load product details.');
      },
    });
  }
}
