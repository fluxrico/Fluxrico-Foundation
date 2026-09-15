import crypto from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { verificationTokens } from "@workspace/db/schema";

/**
 * Single-use, expiring email tokens (email verification and password reset).
 *
 * Security model:
 * - Raw token: 32 bytes of CSPRNG, base64url — high entropy, URL-safe.
 * - Storage: only SHA-256(token) is persisted; the raw value exists solely
 *   inside the emailed link.
 * - Validation: expiry and use are checked on read; consuming is atomic so a
 *   token can only ever be redeemed once.
 * - Issuing a new token consumes every outstanding token for that user, so at
 *   most one live email link exists per account. Reset and verification share
 *   the table: consuming either never grants the other, and a user can always
 *   request a fresh link of either kind.
 */

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export type IssuedToken = {
  token: string;
  expiresAt: Date;
};

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function tokenExpiry(now = new Date()): Date {
  return new Date(now.getTime() + TOKEN_TTL_MS);
}

export function newRawToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Persist a hashed token for the user. Any of the user's outstanding tokens
 * are consumed first so only the newest link works.
 */
export async function issueToken(userId: string): Promise<IssuedToken> {
  await consumeAllTokens(userId);

  const token = newRawToken();
  const expiresAt = tokenExpiry();
  await db.insert(verificationTokens).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return { token, expiresAt };
}

/** Mark every outstanding token for this user as used. */
export async function consumeAllTokens(userId: string, now = new Date()): Promise<void> {
  await db
    .update(verificationTokens)
    .set({ usedAt: now })
    .where(and(eq(verificationTokens.userId, userId), isNull(verificationTokens.usedAt)));
}

export type TokenValidation =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/** Look up a raw token and validate it. Never mutates anything. */
export async function validateToken(token: string, now = new Date()): Promise<TokenValidation> {
  if (!token) return { ok: false, reason: "invalid" };
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.tokenHash, hashToken(token)))
    .limit(1);
  if (!row) return { ok: false, reason: "invalid" };
  if (row.usedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "expired" };
  return { ok: true, userId: row.userId };
}

/** Atomically consume a valid token: succeeds only the first time. */
export async function consumeToken(token: string, now = new Date()): Promise<TokenValidation> {
  const result = await validateToken(token, now);
  if (!result.ok) return result;
  const updated = await db
    .update(verificationTokens)
    .set({ usedAt: now })
    .where(and(eq(verificationTokens.tokenHash, hashToken(token)), isNull(verificationTokens.usedAt)))
    .returning({ id: verificationTokens.id });
  if (updated.length === 0) return { ok: false, reason: "used" };
  return result;
}
