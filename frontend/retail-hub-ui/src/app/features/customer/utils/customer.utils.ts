import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { CartItem } from '../../../core/models/cart.models';
import { Product } from '../models/product.model';
import { ProductService } from '../services/product.service';

export interface LiveCartValidation {
  liveProducts: ReadonlyMap<number, Product>;
  unavailableProductIds: ReadonlySet<number>;
}

/**
 * Rounds currency totals to 2 decimal places without binary floating-point drift.
 */
export function roundCurrency(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Ensures backend UTC timestamps without an explicit offset are parsed as UTC.
 */
export function normalizeUtcDate(value: string): string {
  return /[Zz]$|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value}Z`;
}

/**
 * Fetches current product availability and pricing for every item currently in the cart.
 */
export function fetchLiveCartValidation(
  productService: ProductService,
  items: readonly CartItem[]
): Observable<LiveCartValidation> {
  return forkJoin(
    items.map((item) =>
      productService.getProductById(item.productId).pipe(catchError(() => of(null)))
    )
  ).pipe(
    map((products) => {
      const liveProducts = new Map<number, Product>();
      const unavailableProductIds = new Set<number>();

      products.forEach((product, index) => {
        const item = items[index];
        if (!item) {
          return;
        }
        if (!product || !product.isActive || product.stockQuantity <= 0) {
          unavailableProductIds.add(item.productId);
          return;
        }
        liveProducts.set(product.id, product);
      });

      return { liveProducts, unavailableProductIds };
    })
  );
}
