/**
 * Small in-memory rate limiting shared by the public forms and LYNX.
 * It is per server instance, so on serverless hosting each instance keeps its own count: treat it as a speed bump
 * against casual abuse, not a wall. Nothing here identifies a person; keys are hashed or opaque strings.
 */

export function clientAddress(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
}

/** Returns a checker: `isRateLimited(key)` is true once `key` has made `max` attempts inside `windowMs`. */
export function createRateLimiter(max: number, windowMs: number) {
  const attempts = new Map<string, number[]>();
  return function isRateLimited(key: string): boolean {
    const now = Date.now();
    const recent = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      attempts.set(key, recent);
      return true;
    }
    recent.push(now);
    attempts.set(key, recent);

    // Keep the map from growing forever on a long-running server.
    if (attempts.size > 5_000) {
      for (const [k, times] of attempts) {
        if (times.every((t) => now - t >= windowMs)) attempts.delete(k);
      }
    }
    return false;
  };
}
