/**
 * Tumiza Local Auth
 * Replaces Kimi OAuth with simple email + password login.
 *
 * Flow:
 *   POST /api/auth/login   → verify credentials → set session cookie
 *   POST /api/auth/logout  → clear session cookie  (handled in auth-router)
 *   GET  /api/auth/me      → return current user   (handled in auth-router)
 *
 * Session token is a signed JWT (HS256) using APP_SECRET — same mechanism
 * Kimi used, so session.ts is reused unchanged.
 */

import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { signSessionToken, verifySessionToken } from "./kimi/session";
import { findUserByUnionId, findUserByEmail, updateLastSignIn } from "./queries/users";
import { verifyPassword } from "./lib/password";
import { checkLoginRateLimit } from "./lib/rate-limit";
import { Errors } from "@contracts/errors";

// ─── Request Authentication (used by tRPC context) ────────────────────────────

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    throw Errors.forbidden("No session. Please sign in.");
  }
  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid session. Please sign in again.");
  }
  const user = await findUserByUnionId(claim.unionId);
  if (!user) {
    throw Errors.forbidden("User not found. Please sign in again.");
  }
  return user;
}

// ─── Login Handler (Hono route) ───────────────────────────────────────────────

export function createLoginHandler() {
  return async (c: Context) => {
    // ── Rate limit check (before doing any DB work) ───────────────────────
    const preCheck = checkLoginRateLimit(c.req.raw.headers, false);
    if (!preCheck.allowed) {
      const retryAfterSecs = Math.ceil((preCheck.retryAfterMs ?? 0) / 1000);
      c.header("Retry-After", String(retryAfterSecs));
      return c.json(
        { error: "Too many login attempts. Please try again later." },
        429,
      );
    }

    let body: { email?: string; password?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid request body" }, 400);
    }

    const { email, password } = body;
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    // Find user by email
    const user = await findUserByEmail(email.toLowerCase().trim());
    if (!user || !user.passwordHash) {
      // Record failed attempt before returning — same message for both cases
      // to prevent user enumeration.
      checkLoginRateLimit(c.req.raw.headers, true);
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      checkLoginRateLimit(c.req.raw.headers, true);
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // ── Successful login — clear rate-limit counter for this IP ───────────
    checkLoginRateLimit(c.req.raw.headers, false);

    // Sign session JWT (reuses existing session infrastructure)
    const token = await signSessionToken({
      unionId: user.unionId,
      clientId: "tumiza-local",
    });

    const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
    setCookie(c, Session.cookieName, token, {
      ...cookieOpts,
      maxAge: Session.maxAgeMs / 1000,
    });

    await updateLastSignIn(user.unionId);

    return c.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        stationId: user.stationId,
      },
    });
  };
}
