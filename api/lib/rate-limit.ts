/**
 * Lightweight in-memory rate limiter for the login endpoint.
 *
 * Tracks failed attempts per IP. After MAX_ATTEMPTS failures within
 * WINDOW_MS, the IP is locked out for LOCKOUT_MS.
 *
 * Uses a plain Map — no external dependency, no Redis required.
 * Suitable for single-process deployments (Vercel functions are
 * invocation-scoped, so the map resets per cold start; the window
 * is intentionally short to compensate).
 */

const WINDOW_MS = 15 * 60 * 1000;   // 15 minutes
const MAX_ATTEMPTS = 10;             // max failed attempts per window
const LOCKOUT_MS = 15 * 60 * 1000;  // lockout duration

interface Entry {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

const store = new Map<string, Entry>();

/** Prune stale entries every 10 minutes to avoid memory growth. */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    const expired =
      entry.lockedUntil
        ? now > entry.lockedUntil
        : now - entry.firstAttemptAt > WINDOW_MS;
    if (expired) store.delete(key);
  }
}, 10 * 60 * 1000);

function getIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Call on every login attempt.
 * Returns `{ allowed: true }` or `{ allowed: false, retryAfterMs: number }`.
 */
export function checkLoginRateLimit(
  headers: Headers,
  failed: boolean,
): { allowed: boolean; retryAfterMs?: number } {
  const ip = getIp(headers);
  const now = Date.now();
  const entry = store.get(ip);

  // If locked out
  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return { allowed: false, retryAfterMs: entry.lockedUntil - now };
  }

  if (failed) {
    if (!entry || now - entry.firstAttemptAt > WINDOW_MS) {
      // Start fresh window
      store.set(ip, { attempts: 1, firstAttemptAt: now, lockedUntil: null });
    } else {
      entry.attempts += 1;
      if (entry.attempts >= MAX_ATTEMPTS) {
        entry.lockedUntil = now + LOCKOUT_MS;
        return { allowed: false, retryAfterMs: LOCKOUT_MS };
      }
      store.set(ip, entry);
    }
  } else {
    // Successful login — reset the counter for this IP
    store.delete(ip);
  }

  return { allowed: true };
}
