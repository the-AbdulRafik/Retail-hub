import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL, isBackendApiUrl } from '../config/api.config';
import { AuthService } from '../services/auth.service';

function isPublicAuthEndpoint(url: string): boolean {
  const pathWithoutQuery = url.split('?')[0].toLowerCase();
  return pathWithoutQuery.endsWith('/auth/login') || pathWithoutQuery.endsWith('/auth/register');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const apiBaseUrl = inject(API_BASE_URL);

  const isBackendRequest = isBackendApiUrl(req.url, apiBaseUrl);
  const isPublicAuth = isBackendRequest && isPublicAuthEndpoint(req.url);

  let outgoingRequest = req;
  if (isBackendRequest && !isPublicAuth && !req.headers.has('Authorization')) {
    const token = authService.getToken();
    if (token) {
      outgoingRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }

  return next(outgoingRequest).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isBackendRequest &&
        !isPublicAuth
      ) {
        authService.clearSession();
        const currentUrl = router.url;
        if (!currentUrl.startsWith('/login') && !currentUrl.startsWith('/register')) {
          void router.navigate(['/login'], {
            queryParams: { returnUrl: currentUrl || '/' },
          });
        }
      }

      return throwError(() => error);
    })
  );
};
