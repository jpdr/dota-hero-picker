interface CacheEntry<T> {
  data: T;
  expiresAt: number;
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
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
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
    // Storage full or unavailable — silently ignore
  }
}
