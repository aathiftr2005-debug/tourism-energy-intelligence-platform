import type { LoginCredentials, LoginResponse, User, UserRole } from './types';
import { ROLE_HIERARCHY } from './types';

const SESSION_KEY = 'tei_session';

function getStoredSession(): LoginResponse | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as LoginResponse;
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function storeSession(session: LoginResponse): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    const session = (await response.json()) as LoginResponse;
    storeSession(session);
    return session;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore errors
    }

    clearSession();
  },

  // 🔥 Authentication temporarily disabled
  async getSession(): Promise<LoginResponse | null> {
    return null;
  },

  getCurrentUser(): User | null {
    return null;
  },

  hasRole(requiredRole: string): boolean {
    return true;
  },

  isAuthenticated(): boolean {
    return true;
  },
};