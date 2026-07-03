interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class ApiCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const apiCache = new ApiCache();

export const CACHE_TTL = {
  WEATHER: 15 * 60 * 1000,
  ENERGY: 15 * 60 * 1000,
  CARBON: 10 * 60 * 1000,
  AIR_QUALITY: 30 * 60 * 1000,
  EMERGENCY: 5 * 60 * 1000,
} as const;
