import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { finalize } from 'rxjs';

import { OrdersApiService, Order } from '../../services/orders-api.service';
import {
  InventoryApiService,
  InventoryItem,
} from '../../services/inventory-api.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CurrencyPipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly inventoryApi = inject(InventoryApiService);

  protected recentOrders: Order[] = [];
  protected lowStockProducts: InventoryItem[] = [];

  protected isLoadingOrders = false;
  protected isLoadingInventory = false;

  protected ordersError = '';
  protected inventoryError = '';

  ngOnInit(): void {
    this.loadRecentOrders();
    this.loadLowStockProducts();
  }

  protected loadRecentOrders(): void {
    this.isLoadingOrders = true;
    this.ordersError = '';

    this.ordersApi
      .getOrders({ page: 1, pageSize: 5 })
      .pipe(finalize(() => (this.isLoadingOrders = false)))
      .subscribe({
        next: (response) => {
          this.recentOrders = response.items;
        },
        error: (error) => {
          console.error('Unable to load recent orders:', error);
          this.ordersError =
            error.error?.detail ||
            error.error?.title ||
            'Unable to load recent orders.';
          this.recentOrders = [];
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
      .pipe(finalize(() => (this.isLoadingInventory = false)))
      .subscribe({
        next: (response) => {
          this.lowStockProducts = response.items;
        },
        error: (error) => {
          console.error('Unable to load low-stock inventory:', error);
          this.inventoryError =
            error.error?.detail ||
            error.error?.title ||
            'Unable to load low-stock inventory.';
          this.lowStockProducts = [];
        },
      });
  }

  protected formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  protected getItemCount(order: Order): number {
    return order.items.reduce((total, item) => total + item.quantity, 0);
  }
}
