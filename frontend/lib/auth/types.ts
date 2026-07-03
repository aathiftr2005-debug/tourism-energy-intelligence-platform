export type UserRole = 'admin' | 'analyst' | 'operator' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: number;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  viewer: 0,
  operator: 1,
  analyst: 2,
  admin: 3,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  analyst: 'Government Analyst',
  operator: 'Energy Operator',
  viewer: 'Viewer',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  analyst: ['read:dashboard', 'read:forecasts', 'read:stress', 'read:map', 'read:reports', 'export:data'],
  operator: ['read:dashboard', 'read:energy', 'read:map', 'read:alerts', 'write:settings'],
  viewer: ['read:dashboard', 'read:map'],
};
