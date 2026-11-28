import { DecimalPipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';
import { extractApiErrorMessage } from '../../../../core/models/api-error.models';
import { CartService } from '../../../../core/services/cart.service';
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
  private readonly cartService = inject(CartService);
  private readonly destroyRef = inject(DestroyRef);

  readonly quantity = signal(1);
  readonly cartItemCount = this.cartService.itemCount;
  readonly message = signal('');
  readonly messageType = signal<'success' | 'error'>('success');
  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly imageFailed = signal(false);

  constructor() {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          this.product.set(null);
          this.message.set('');
          this.imageFailed.set(false);
          this.errorMessage.set('');

          if (!Number.isInteger(id) || id <= 0) {
            this.loading.set(false);
            this.errorMessage.set('The product link is invalid.');
            return EMPTY;
          }

          this.loading.set(true);
          return this.productService.getProductById(id).pipe(
            tap((product) => {
              this.product.set(product);
              this.quantity.set(product.stockQuantity > 0 ? 1 : 0);
              this.loading.set(false);
            }),
            catchError((error: unknown) => {
              this.loading.set(false);
              this.errorMessage.set(
                extractApiErrorMessage(error, 'Unable to load product details.')
              );
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  increaseQuantity(): void {
    const product = this.product();
    if (!product) return;
    this.quantity.update((value) => Math.min(product.stockQuantity, value + 1));
    this.message.set('');
  }

  decreaseQuantity(): void {
    if (this.product()?.stockQuantity === 0) return;
    this.quantity.update((value) => Math.max(1, value - 1));
    this.message.set('');
  }

  addToCart(): void {
    const product = this.product();
    const quantity = this.quantity();
    if (!product || !product.isActive || quantity < 1 || quantity > product.stockQuantity) {
      this.messageType.set('error');
      this.message.set(
        product && !product.isActive
          ? 'This product is currently unavailable.'
          : 'Choose a quantity that is available in stock.'
      );
      return;
    }

    const existingQuantity =
      this.cartService.items().find((item) => item.productId === product.id)?.quantity ?? 0;
    if (existingQuantity + quantity > product.stockQuantity) {
      this.messageType.set('error');
      this.message.set(
        `Your cart already contains ${existingQuantity} unit(s); only ${product.stockQuantity} are available.`
      );
      return;
    }

    this.cartService.addItem(
      {
        productId: product.id,
        productName: product.name,
        unitPrice: product.price,
        packagingDetails: `${product.packagingType} - ${product.packagingSize}`,
        imageUrl: product.imageUrl,
        maxStock: product.stockQuantity,
      },
      quantity
    );
    this.messageType.set('success');
    this.message.set(`${quantity} × ${product.name} added to your cart.`);
  }

  markImageFailed(): void {
    this.imageFailed.set(true);
  }
}
