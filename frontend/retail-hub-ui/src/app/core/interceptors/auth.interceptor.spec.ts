import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:5266/api' },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('attaches Bearer token to backend API requests but not external URLs or login', () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('test-jwt-token');

    http.get('http://localhost:5266/api/auth/me').subscribe();
    const meReq = httpMock.expectOne('http://localhost:5266/api/auth/me');
    expect(meReq.request.headers.get('Authorization')).toBe('Bearer test-jwt-token');
    meReq.flush({});

    http.post('http://localhost:5266/api/auth/login', {}).subscribe();
    const loginReq = httpMock.expectOne('http://localhost:5266/api/auth/login');
    expect(loginReq.request.headers.has('Authorization')).toBe(false);
    loginReq.flush({});

    http.get('https://external.example.com/data').subscribe();
    const extReq = httpMock.expectOne('https://external.example.com/data');
    expect(extReq.request.headers.has('Authorization')).toBe(false);
    extReq.flush({});
  });

  it('clears session on 401 without clearing session on 403', () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('test-jwt-token');
    const clearSpy = vi.spyOn(authService, 'clearSession');
    const navSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    let forbiddenStatus = 0;
    http.get('http://localhost:5266/api/orders').subscribe({
      error: (err) => {
        forbiddenStatus = err.status;
      },
    });
    const req403 = httpMock.expectOne('http://localhost:5266/api/orders');
    req403.flush({}, { status: 403, statusText: 'Forbidden' });
    expect(forbiddenStatus).toBe(403);
    expect(clearSpy).not.toHaveBeenCalled();

    let unauthorizedStatus = 0;
    http.get('http://localhost:5266/api/auth/me').subscribe({
      error: (err) => {
        unauthorizedStatus = err.status;
      },
    });
    const req401 = httpMock.expectOne('http://localhost:5266/api/auth/me');
    req401.flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(unauthorizedStatus).toBe(401);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(navSpy).toHaveBeenCalled();
  });
});
