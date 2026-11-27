import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { API_BASE_URL } from '../config/api.config';
import { AuthResponse, USER_ROLES } from '../models/auth.models';
import { AuthService } from './auth.service';

function makeJwtWithExp(expSeconds: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'u1', exp: expSeconds }));
  return `${header}.${payload}.sig`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:5266/api' },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('persists session on login and distinguishes Admin vs Customer roles', () => {
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const token = makeJwtWithExp(Math.floor(Date.now() / 1000) + 3600);
    const mockResponse: AuthResponse = {
      token,
      expiresAt: futureDate,
      user: {
        id: 'admin-1',
        displayName: 'System Admin',
        email: 'admin@retailhub.local',
        roles: [USER_ROLES.Admin],
      },
    };

    service.login({ email: 'admin@retailhub.local', password: 'secret' }).subscribe();

    const req = httpMock.expectOne('http://localhost:5266/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(service.isCustomer()).toBe(false);
    expect(service.getToken()).toBe(token);
  });

  it('clears expired token on restoration', () => {
    const pastDate = new Date(Date.now() - 60 * 1000).toISOString();
    const expiredToken = makeJwtWithExp(Math.floor(Date.now() / 1000) - 60);
    sessionStorage.setItem(
      'retailhub.auth.session',
      JSON.stringify({
        token: expiredToken,
        expiresAt: pastDate,
        user: {
          id: 'u-1',
          displayName: 'Old User',
          email: 'old@example.com',
          roles: [USER_ROLES.Customer],
        },
      })
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const freshService = TestBed.inject(AuthService);

    expect(freshService.isAuthenticated()).toBe(false);
    expect(freshService.getToken()).toBeNull();
    expect(sessionStorage.getItem('retailhub.auth.session')).toBeNull();
  });

  it('clears session and navigates to /login on logout', () => {
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const token = makeJwtWithExp(Math.floor(Date.now() / 1000) + 3600);

    service.register({ displayName: 'Cust', email: 'c@example.com', password: 'Password1' }).subscribe();
    const req = httpMock.expectOne('http://localhost:5266/api/auth/register');
    req.flush({
      token,
      expiresAt: futureDate,
      user: { id: 'c1', displayName: 'Cust', email: 'c@example.com', roles: [USER_ROLES.Customer] },
    });

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });
});
