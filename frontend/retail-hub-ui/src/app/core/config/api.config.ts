import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});

export function isBackendApiUrl(url: string, apiBaseUrl: string): boolean {
  const normalizedBase = apiBaseUrl.replace(/\/+$/, '');
  return url.startsWith(normalizedBase) || url.startsWith('/api/') || url === '/api';
}
