import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [RouterLink],
  template: `
    <section class="placeholder-card">
      <h1>Register</h1>
      <p>Customer registration form will be implemented after API contract sign-off.</p>
      <p><a routerLink="/login">Already registered? Login</a></p>
    </section>
  `,
  styles: `
    .placeholder-card {
      max-width: 420px;
      margin: 2rem auto;
      padding: 1.5rem;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
    }
  `,
})
export class Register {}
