import { CurrencyPipe } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { extractApiErrorMessage } from '../../../../core/models/api-error.models';
import { BrandApiService } from '../../services/brand-api.service';
import { CategoryApiService } from '../../services/category-api.service';
import {
  InventoryApiService,
  InventoryItem,
} from '../../services/inventory-api.service';
import { Order, OrdersApiService, OrderStatus } from '../../services/orders-api.service';
import { ProductApiService } from '../../services/product-api.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly inventoryApi = inject(InventoryApiService);
  private readonly productApi = inject(ProductApiService);
  private readonly brandApi = inject(BrandApiService);
  private readonly categoryApi = inject(CategoryApiService);

  protected recentOrders: Order[] = [];
  protected lowStockProducts: InventoryItem[] = [];

  protected totalOrdersCount = 0;
  protected totalLowStockCount = 0;
  protected activeProductsCount = 0;
  protected activeBrandsCount = 0;
  protected activeCategoriesCount = 0;

  protected isLoadingOrders = false;
  protected isLoadingInventory = false;
  protected isLoadingCatalogStats = false;

  protected ordersError = '';
  protected inventoryError = '';
  protected catalogStatsError = '';

  ngOnInit(): void {
    this.loadRecentOrders();
    this.loadLowStockProducts();
    this.loadCatalogStats();
  }

  protected loadRecentOrders(): void {
    this.isLoadingOrders = true;
    this.ordersError = '';

    this.ordersApi
      .getOrders({ page: 1, pageSize: 5 })
      .pipe(
        finalize(() => {
          this.isLoadingOrders = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.recentOrders = [...response.items];
          this.totalOrdersCount = response.totalCount;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.ordersError = extractApiErrorMessage(
            error,
            'Unable to load recent orders.',
          );
          this.recentOrders = [];
          this.totalOrdersCount = 0;
          this.cdr.markForCheck();
        },
      });
  }

  protected loadLowStockProducts(): void {
    this.isLoadingInventory = true;
    this.inventoryError = '';

    this.inventoryApi
      .getInventory({
        page: 1,
        pageSize: 5,
        lowStockOnly: true,
      })
      .pipe(
        finalize(() => {
          this.isLoadingInventory = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.lowStockProducts = [...response.items];
          this.totalLowStockCount = response.totalCount;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.inventoryError = extractApiErrorMessage(
            error,
            'Unable to load low-stock inventory.',
          );
          this.lowStockProducts = [];
          this.totalLowStockCount = 0;
          this.cdr.markForCheck();
        },
      });
  }

  protected loadCatalogStats(): void {
    this.isLoadingCatalogStats = true;
    this.catalogStatsError = '';

    forkJoin({
      products: this.productApi.getProducts({
        page: 1,
        pageSize: 1,
        includeInactive: false,
      }),
      brands: this.brandApi.getBrands(false),
      categories: this.categoryApi.getCategories(false),
    })
      .pipe(
        catchError((error: unknown) => {
          this.catalogStatsError = extractApiErrorMessage(
            error,
            'Unable to load catalog statistics.',
          );
          return of(null);
        }),
        finalize(() => {
          this.isLoadingCatalogStats = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (!result) {
          return;
        }

        this.activeProductsCount = result.products.totalCount;
        this.activeBrandsCount = result.brands.length;
        this.activeCategoriesCount = result.categories.length;
        this.cdr.markForCheck();
      });
  }

  protected formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  protected getItemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }

  protected getStatusClass(status: OrderStatus): string {
    return status.toLowerCase();
  }
}
