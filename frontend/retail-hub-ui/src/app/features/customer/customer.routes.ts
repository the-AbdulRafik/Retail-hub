import { Routes } from '@angular/router';

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
];
