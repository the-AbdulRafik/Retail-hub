import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/customer-home/customer-home').then((m) => m.CustomerHome),
  },

  {
    path: 'products/:id',
    loadComponent: () =>
      import('./pages/product-details/product-details').then((m) => m.ProductDetails),
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./pages/shopping-cart/shopping-cart').then((m) => m.ShoppingCart),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/checkout/checkout').then((m) => m.Checkout),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/my-orders/my-orders').then((m) => m.MyOrders),
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/order-details/order-details').then((m) => m.OrderDetails),
  },
];
