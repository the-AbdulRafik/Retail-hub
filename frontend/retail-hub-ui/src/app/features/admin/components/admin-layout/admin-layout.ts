
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout {
  protected readonly navigation = [
    { label: 'Overview', icon: '▦', route: '/admin' },
    { label: 'Brands', icon: '◈', route: '/admin/brands' },
    { label: 'Categories', icon: '▤', route: '/admin/categories' },
    { label: 'Products', icon: '□', route: '/admin/products' },
    { label: 'Inventory', icon: '▥', route: '/admin/inventory' },
    { label: 'Orders', icon: '▣', route: '/admin/orders' },
  ];
}
