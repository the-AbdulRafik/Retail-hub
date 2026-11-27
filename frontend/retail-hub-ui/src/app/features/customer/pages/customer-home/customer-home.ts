import { Component } from '@angular/core';

@Component({
  selector: 'app-customer-home',
  template: `
    <section class="placeholder-panel">
      <h1>Customer Portal</h1>
      <p>Catalog, search/filter, product packaging details, cart, checkout, and order history live here (Developer 2).</p>
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
export class CustomerHome {}
