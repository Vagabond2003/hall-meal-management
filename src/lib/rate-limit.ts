type RateLimitStore = Map<string, { count: number; resetTime: number }>;

export function createRateLimiter(limit: number, windowMs: number) {
  const store: RateLimitStore = new Map();

  return function check(key: string): { success: boolean; remaining: number } {
    const now = Date.now();

    // Clean up expired entries to prevent memory leaks
    for (const [k, entry] of store.entries()) {
      if (now > entry.resetTime) {
        store.delete(k);
      }
    }

    const entry = store.get(key);
    if (!entry || now > entry.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      return { success: true, remaining: limit - 1 };
    }
    if (entry.count >= limit) {
      return { success: false, remaining: 0 };
    }
    entry.count += 1;
    return { success: true, remaining: limit - entry.count };
  };
}
