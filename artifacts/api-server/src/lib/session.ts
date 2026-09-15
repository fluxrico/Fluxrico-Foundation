import crypto from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "@workspace/db";
import { sessions, users } from "@workspace/db/schema";

/**
 * HTTP-only cookie sessions backed by a server-side sessions table.
 *
 * - Cookie holds an opaque random session id (32 bytes CSPRNG, base64url).
 *   No user identity, no signature, nothing to forge — validity is a DB row.
 * - HttpOnly + SameSite=Lax; Secure whenever the request is HTTPS (or
 *   COOKIE_SECURE is set), so local HTTP development still works.
 * - Expiry is enforced twice: cookie Max-Age and a DB-side check on read.
 * - Identity resolution happens ONLY here: every authenticated route calls
 *   requireUser and trusts nothing from the request body, query, or headers.
 */

export const SESSION_COOKIE_NAME = "fluxrico_session";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

const isProduction = process.env.NODE_ENV === "production";

function cookieSecure(req: Request): boolean {
  if (process.env.COOKIE_SECURE != null) return process.env.COOKIE_SECURE === "true";
  if (!isProduction) return false;
  // Trust proxy is configured in app.ts, so protocol reflects the real client.
  return req.protocol === "https";
}

export function newSessionId(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export async function createSession(userId: string): Promise<{ id: string; expiresAt: Date }> {
  const id = newSessionId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ id, userId, expiresAt });
  return { id, expiresAt };
}

export function setSessionCookie(res: Response, sessionId: string, expiresAt: Date, req: Request): void {
  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(req),
    expires: expiresAt,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
  });
}

async function destroySession(sessionId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export function readSessionId(req: Request): string | null {
  const raw = req.cookies?.[SESSION_COOKIE_NAME];
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

/** Current user + session from the cookie, or null when signed out/expired. */
export async function getSessionUser(
  req: Request,
): Promise<{ user: typeof users.$inferSelect; session: typeof sessions.$inferSelect } | null> {
  const sessionId = readSessionId(req);
  if (!sessionId) return null;

  const [row] = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!row) return null;
  return { user: row.user, session: row.session };
}

/**
 * Authenticated-route guard. Resolves identity from the session cookie only.
 * Rejects with 401 when there is no valid session. Optional emailVerified
 * enforcement keeps workspace access gated on a verified address.
 */
export async function requireUser(
  req: Request,
  res: Response,
  options: { requireVerified?: boolean } = {},
): Promise<typeof users.$inferSelect | null> {
  const found = await getSessionUser(req);
  if (!found) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required." });
    return null;
  }
  if (options.requireVerified && !found.user.emailVerified) {
    res.status(403).json({ error: "email_not_verified", message: "Verify your email to continue." });
    return null;
  }
  return found.user;
}

export async function destroyCurrentSession(req: Request, res: Response): Promise<void> {
  const sessionId = readSessionId(req);
  if (sessionId) await destroySession(sessionId);
  clearSessionCookie(res);
}
