import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import {
  AuthResponse,
  AuthenticatedUser,
  isUserRole,
  LoginRequest,
  RegisterRequest,
  USER_ROLES,
  UserResponse,
  UserRole,
} from '../models/auth.models';

interface StoredAuthSession {
  token: string;
  expiresAt: string;
  user: AuthenticatedUser;
}

const AUTH_SESSION_STORAGE_KEY = 'retailhub.auth.session';

/**
 * Shared authentication state service using Angular signals and browser `sessionStorage`.
 *
 * Security limitation: storing a JWT in `sessionStorage` preserves login across page refreshes
 * within the current tab and clears when the tab closes, but any script running in the origin
 * (XSS) can read `sessionStorage`. Refresh tokens and `HttpOnly` cookies are not implemented by
 * the current backend. Never store user passwords in state or storage.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly sessionState = signal<StoredAuthSession | null>(this.restoreSession());

  readonly currentUser = computed<AuthenticatedUser | null>(
    () => this.sessionState()?.user ?? null
  );
  readonly isAuthenticated = computed<boolean>(() => {
    const session = this.sessionState();
    return session !== null && !this.isSessionExpired(session);
  });
  readonly isAdmin = computed<boolean>(() => this.hasRole(USER_ROLES.Admin));
  readonly isCustomer = computed<boolean>(() => this.hasRole(USER_ROLES.Customer));

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/login`, request)
      .pipe(tap((response) => this.persistSession(response)));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiBaseUrl}/auth/register`, request)
      .pipe(tap((response) => this.persistSession(response)));
  }

  fetchCurrentUser(): Observable<UserResponse> {
    return this.http
      .get<UserResponse>(`${this.apiBaseUrl}/auth/me`)
      .pipe(tap((user) => this.updateStoredUser(user)));
  }

  logout(options: { redirectTo?: string | null } = {}): void {
    this.clearSession();
    const target = options.redirectTo === undefined ? '/login' : options.redirectTo;
    if (target !== null) {
      void this.router.navigateByUrl(target);
    }
  }

  clearSession(): void {
    this.sessionState.set(null);
    this.safeRemoveStorage();
  }

  getToken(): string | null {
    const session = this.sessionState();
    if (!session) {
      return null;
    }

    if (this.isSessionExpired(session)) {
      this.clearSession();
      return null;
    }

    return session.token;
  }

  hasRole(role: UserRole): boolean {
    const session = this.sessionState();
    if (!session || this.isSessionExpired(session)) {
      return false;
    }
    return session.user.roles.includes(role);
  }

  isTokenExpired(): boolean {
    const session = this.sessionState();
    if (!session) {
      return true;
    }
    return this.isSessionExpired(session);
  }

  getDefaultRouteForCurrentUser(): string {
    if (this.hasRole(USER_ROLES.Admin)) {
      return '/admin';
    }
    return '/customer';
  }

  navigateByRole(): Promise<boolean> {
    return this.router.navigateByUrl(this.getDefaultRouteForCurrentUser());
  }

  private persistSession(response: AuthResponse): void {
    const normalizedSession: StoredAuthSession = {
      token: response.token,
      expiresAt: response.expiresAt,
      user: {
        id: response.user.id,
        displayName: response.user.displayName,
        email: response.user.email,
        roles: response.user.roles.filter(isUserRole),
      },
    };

    if (this.isSessionExpired(normalizedSession)) {
      this.clearSession();
      return;
    }

    this.sessionState.set(normalizedSession);
    this.safeWriteStorage(normalizedSession);
  }

  private updateStoredUser(user: UserResponse): void {
    const existing = this.sessionState();
    if (!existing || this.isSessionExpired(existing)) {
      this.clearSession();
      return;
    }

    const updatedSession: StoredAuthSession = {
      ...existing,
      user: {
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        roles: user.roles.filter(isUserRole),
      },
    };

    this.sessionState.set(updatedSession);
    this.safeWriteStorage(updatedSession);
  }

  private restoreSession(): StoredAuthSession | null {
    const raw = this.safeReadStorage();
    if (!raw) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isStoredAuthSession(parsed) || this.isSessionExpired(parsed)) {
        this.safeRemoveStorage();
        return null;
      }
      return parsed;
    } catch {
      this.safeRemoveStorage();
      return null;
    }
  }

  private isSessionExpired(session: StoredAuthSession): boolean {
    const expiresAtMs = Date.parse(session.expiresAt);
    if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
      return true;
    }

    const jwtExpMs = extractJwtExpirationMs(session.token);
    if (jwtExpMs !== null && jwtExpMs <= Date.now()) {
      return true;
    }

    return false;
  }

  private safeReadStorage(): string | null {
    try {
      return typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)
        : null;
    } catch {
      return null;
    }
  }

  private safeWriteStorage(session: StoredAuthSession): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
      }
    } catch {
      // Ignore storage quota errors; in-memory signal remains active for this view.
    }
  }

  private safeRemoveStorage(): void {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore storage access errors.
    }
  }
}

function isStoredAuthSession(value: unknown): value is StoredAuthSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record['token'] !== 'string' ||
    record['token'].length === 0 ||
    typeof record['expiresAt'] !== 'string' ||
    typeof record['user'] !== 'object' ||
    record['user'] === null
  ) {
    return false;
  }

  const user = record['user'] as Record<string, unknown>;
  return (
    typeof user['id'] === 'string' &&
    typeof user['displayName'] === 'string' &&
    typeof user['email'] === 'string' &&
    Array.isArray(user['roles']) &&
    user['roles'].every(isUserRole)
  );
}

function extractJwtExpirationMs(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payloadJson = atob(padded);
    const payload: unknown = JSON.parse(payloadJson);
    if (typeof payload === 'object' && payload !== null) {
      const exp = (payload as Record<string, unknown>)['exp'];
      if (typeof exp === 'number' && Number.isFinite(exp)) {
        return exp * 1000;
      }
    }
    return null;
  } catch {
    return null;
  }
}
