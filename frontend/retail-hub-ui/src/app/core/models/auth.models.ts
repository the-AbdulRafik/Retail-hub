export const USER_ROLES = {
  Admin: 'Admin',
  Customer: 'Customer',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  displayName: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  displayName: string;
  email: string;
  roles: readonly UserRole[];
}

export type AuthenticatedUser = UserResponse;

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: UserResponse;
}

export function isUserRole(value: unknown): value is UserRole {
  return value === USER_ROLES.Admin || value === USER_ROLES.Customer;
}
