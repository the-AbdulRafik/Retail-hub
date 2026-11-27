import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { adminGuard } from './admin.guard';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

describe('Route Guards', () => {
  let authService: AuthService;
  let router: Router;
  const dummyRoute = {} as ActivatedRouteSnapshot;
  const adminState = { url: '/admin' } as RouterStateSnapshot;
  const ordersState = { url: '/customer/orders' } as RouterStateSnapshot;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('redirects unauthenticated users from authGuard and adminGuard to /login', () => {
    const authResult = TestBed.runInInjectionContext(() => authGuard(dummyRoute, ordersState));
    expect(authResult instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(authResult as UrlTree)).toContain('/login');

    const adminResult = TestBed.runInInjectionContext(() => adminGuard(dummyRoute, adminState));
    expect(adminResult instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(adminResult as UrlTree)).toContain('/login');
  });

  it('blocks authenticated Customer from adminGuard and redirects to /customer', () => {
    vi.spyOn(authService, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(authService, 'isAdmin').mockReturnValue(false);

    const adminResult = TestBed.runInInjectionContext(() => adminGuard(dummyRoute, adminState));
    expect(adminResult instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(adminResult as UrlTree)).toBe('/customer');
  });

  it('allows Admin through adminGuard and redirects authenticated users away from guestGuard', () => {
    vi.spyOn(authService, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(authService, 'isAdmin').mockReturnValue(true);
    vi.spyOn(authService, 'getDefaultRouteForCurrentUser').mockReturnValue('/admin');

    const adminResult = TestBed.runInInjectionContext(() => adminGuard(dummyRoute, adminState));
    expect(adminResult).toBe(true);

    const guestResult = TestBed.runInInjectionContext(() => guestGuard(dummyRoute, adminState));
    expect(guestResult instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(guestResult as UrlTree)).toBe('/admin');
  });
});
