import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly authService = inject(AuthService);
  protected readonly title = signal('RetailHub');

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.authService.fetchCurrentUser().subscribe({
        error: () => {
          // 401 errors are cleared by authInterceptor; transient network errors preserve restored session.
        },
      });
    }
  }

  protected onLogout(): void {
    this.authService.logout();
  }
}
