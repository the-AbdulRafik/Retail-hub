import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/admin-layout/admin-layout').then(
        (m) => m.AdminLayout,
      ),
    children: [
      {
        path: '',
        data: { title: 'Dashboard Overview', section: 'Overview' },
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard').then(
            (m) => m.AdminDashboard,
          ),
      },
      {
        path: 'brands',
        data: { title: 'Brand Management', section: 'Brands' },
        loadComponent: () =>
          import('./pages/admin-brands/admin-brands').then(
            (m) => m.AdminBrands,
          ),
      },
      {
        path: 'categories',
        data: { title: 'Category Management', section: 'Categories' },
        loadComponent: () =>
          import('./pages/admin-categories/admin-categories').then(
            (m) => m.AdminCategories,
          ),
      },
      {
        path: 'products',
        data: { title: 'Product Management', section: 'Products' },
        loadComponent: () =>
          import('./pages/admin-products/admin-products').then(
            (m) => m.AdminProducts,
          ),
      },
      {
        path: 'inventory',
        data: { title: 'Inventory Management', section: 'Inventory' },
        loadComponent: () =>
          import('./pages/admin-inventory/admin-inventory').then(
            (m) => m.AdminInventory,
          ),
      },
      {
        path: 'orders',
        data: { title: 'Orders Management', section: 'Orders' },
        loadComponent: () =>
          import('./pages/admin-orders/admin-orders').then(
            (m) => m.AdminOrders,
          ),
      },
    ],
  },
];
