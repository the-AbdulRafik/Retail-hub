import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css',
})
export class AdminLayout implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly navigation = [
    { label: 'Overview', icon: '▦', route: '/admin' },
    { label: 'Brands', icon: '◈', route: '/admin/brands' },
    { label: 'Categories', icon: '▤', route: '/admin/categories' },
    { label: 'Products', icon: '□', route: '/admin/products' },
    { label: 'Inventory', icon: '▥', route: '/admin/inventory' },
    { label: 'Orders', icon: '▣', route: '/admin/orders' },
  ];

  protected readonly adminDisplayName = computed(
    () => this.authService.currentUser()?.displayName?.trim() || 'Administrator',
  );

  protected readonly adminEmail = computed(
    () => this.authService.currentUser()?.email?.trim() || 'Store management',
  );

  protected readonly adminInitial = computed(() => {
    const name = this.adminDisplayName();
    return name.charAt(0).toUpperCase() || 'A';
  });

  protected readonly pageTitle = signal('Dashboard Overview');
  protected readonly breadcrumbSection = signal('Overview');

  ngOnInit(): void {
    this.syncRouteMetadata();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.syncRouteMetadata());
  }

  private syncRouteMetadata(): void {
    let active: ActivatedRoute | null = this.route;
    while (active?.firstChild) {
      active = active.firstChild;
    }

    const data = active?.snapshot.data;
    const title = typeof data?.['title'] === 'string' ? data['title'] : 'Admin Workspace';
    const section = typeof data?.['section'] === 'string' ? data['section'] : 'Overview';

    this.pageTitle.set(title);
    this.breadcrumbSection.set(section);
  }
}
