/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Trade-off: Vercel serverless functions are stateless — each cold-start
 * instance gets its own map. So this stops a single attacker from a single
 * IP hammering *the same warm instance*, which in practice blunts most
 * brute-force attempts (Vercel keeps instances warm under load).
 *
 * For distributed / rotating-IP attacks, upgrade to Upstash Ratelimit.
 */

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();
const MAX_ENTRIES = 5000; // simple bound so the map can't grow forever

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });

    // Occasionally sweep expired entries to bound memory.
    if (buckets.size > MAX_ENTRIES) sweep(now);

    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }

  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

function sweep(now: number) {
  for (const [k, v] of buckets) {
    if (v.resetAt < now) buckets.delete(k);
  }
}

/** Best-effort client IP extraction from Vercel / Next.js request. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Standard 429 response with Retry-After header. */
export function tooManyRequests(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({ error: "Too many attempts. Try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}
