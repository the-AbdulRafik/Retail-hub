
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
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard').then(
            (m) => m.AdminDashboard,
          ),
      },
      {
        path: 'brands',
        loadComponent: () =>
          import('./pages/admin-brands/admin-brands').then(
            (m) => m.AdminBrands,
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/admin-categories/admin-categories').then(
            (m) => m.AdminCategories,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/admin-products/admin-products').then(
            (m) => m.AdminProducts,
          ),
      },
    ],
  },
];
