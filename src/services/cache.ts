interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

function isValidCacheEntry(value: unknown): value is CacheEntry<unknown> {
  return typeof value === 'object'
    && value !== null
    && 'data' in value
    && 'expiresAt' in value
    && typeof (value as CacheEntry<unknown>).expiresAt === 'number';
}

export function getCached<T>(key: string): T | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isValidCacheEntry(parsed)) {
      localStorage.removeItem(key);
      return null;
    }
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.data as T;
  } catch {
    return null;
  }
}

export function setCache<T>(key: string, data: T, ttlMinutes: number): void {
  if (typeof window === 'undefined') {
    return;
  }
  const entry: CacheEntry<T> = {
    data,
    expiresAt: Date.now() + ttlMinutes * 60 * 1000,
  };
  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable
  }
}
