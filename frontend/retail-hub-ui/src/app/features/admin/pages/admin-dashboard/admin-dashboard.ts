import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-dashboard',
  template: `
    <section class="placeholder-panel">
      <h1>Admin Portal</h1>
      <p>Dashboard, brands, categories, products, inventory, orders, and business statistics live here (Developer 3).</p>
    </section>
  `,
  styles: `
    .placeholder-panel {
      padding: 1.5rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }
  `,
})
export class AdminDashboard {}
