import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
// Extensionless relative specifiers: see lib/billing.ts for the rationale
// (bare @workspace/* exports point at .ts sources, unresolvable in the
// Vercel classic Node runtime).
import { db } from "../../../../lib/db/src/index.js";
import { sessions, users } from "../../../../lib/db/src/schema/index.js";
import {
  LoginBody,
  ForgotPasswordBody,
  RegisterBody,
  ResetPasswordBody,
  VerifyEmailBody,
} from "../../../../lib/api-zod/src/index.js";
import { HttpError, sendError } from "../lib/errors.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { issueToken, consumeToken, consumeAllTokens } from "../lib/tokens.js";
import { isEmailDeliveryConfigured, sendEmail, verificationEmail, passwordResetEmail } from "../lib/email.js";
import {
  createSession,
  destroyCurrentSession,
  getSessionUser,
  setSessionCookie,
} from "../lib/session.js";
import {
  clearLimit,
  consumeLimit,
  createIpRateLimiter,
  emailAccountKey,
  sendTooMany,
  type RateLimitOptions,
} from "../middlewares/rateLimit.js";

const router: IRouter = Router();

/**
 * Shared (Redis-backed) fixed-window limits — see middlewares/rateLimit.ts.
 * All windows 15 min. Conservative start values chosen to avoid accidental
 * lockouts (e.g. single-IP NAT offices); tune after observing real failure rates.
 *
 * The per-email login counter is keyed on the NORMALIZED submitted email and
 * incremented before the account lookup, so real and nonexistent addresses
 * consume attempts identically (no enumeration signal); it is cleared on a
 * successful login, making lockouts time-bounded, never permanent.
 */
const WINDOW_15_MIN = 15 * 60 * 1000;
const LOGIN_ATTEMPTS: RateLimitOptions = { prefix: "rl:login:ip", limit: 10, windowMs: WINDOW_15_MIN };
const LOGIN_ACCOUNT_FAILURES: RateLimitOptions = { prefix: "rl:login:email", limit: 10, windowMs: WINDOW_15_MIN };
const REGISTER_ATTEMPTS: RateLimitOptions = { prefix: "rl:register:ip", limit: 5, windowMs: WINDOW_15_MIN };
const FORGOT_ATTEMPTS: RateLimitOptions = { prefix: "rl:forgot:ip", limit: 5, windowMs: WINDOW_15_MIN };
const FORGOT_ACCOUNT: RateLimitOptions = { prefix: "rl:forgot:email", limit: 5, windowMs: WINDOW_15_MIN };
const RESEND_ATTEMPTS: RateLimitOptions = { prefix: "rl:resend:ip", limit: 5, windowMs: WINDOW_15_MIN };
const RESEND_ACCOUNT: RateLimitOptions = { prefix: "rl:resend:email", limit: 5, windowMs: WINDOW_15_MIN };
// /verify + /reset-password probe high-entropy single-use tokens; the cap
// exists to blunt sustained guessing and keep costs bounded, not because
// 20 attempts realistically undermine entropy.
const TOKEN_GUESS_ATTEMPTS: RateLimitOptions = { prefix: "rl:tokens:ip", limit: 20, windowMs: WINDOW_15_MIN };

/** Serialize a user for the client. passwordHash never crosses this line. */
function publicUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
  };
}

function appBaseUrl(req: Request): string {
  const configured = process.env.APP_BASE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const host = req.get("host") ?? "localhost:5000";
  const proto = req.protocol === "https" || req.secure ? "https" : "http";
  return `${proto}://${host}`;
}

// ── Register ─────────────────────────────────────────────────────────────────

router.post("/register", createIpRateLimiter(REGISTER_ATTEMPTS), async (req, res) => {
  try {
    const input = RegisterBody.parse(req.body);

    let passwordHash: string;
    try {
      passwordHash = await hashPassword(input.password);
    } catch (cause) {
      console.error(
        JSON.stringify({ event: "password_hash_failed", message: cause instanceof Error ? cause.message : String(cause) }),
      );
      throw new HttpError(500, "internal_error", "Could not create the account. Please try again.");
    }

    let created: typeof users.$inferSelect;
    try {
      [created] = await db
        .insert(users)
        .values({ name: input.name.trim(), email: input.email.trim().toLowerCase(), passwordHash })
        .returning();
    } catch (cause) {
      if (cause instanceof Error && (cause as { code?: string }).code === "23505") {
        // Unique violation on email — the authoritative duplicate check,
        // covering the race between the pre-check below and concurrent inserts.
        throw new HttpError(409, "email_taken", "An account with this email already exists.");
      }
      throw cause;
    }

    const { token } = await issueToken(created.id);
    // The trial row is provisioned lazily at the first verified, authenticated
    // access (resolveSubscription) — so the 3 days belong to a user who can
    // actually sign in, not to an unverified registration.
    const verifyUrl = `${appBaseUrl(req)}/verify?token=${encodeURIComponent(token)}`;
    const delivery = await sendEmail({ ...verificationEmail(created.name, verifyUrl), to: created.email });

    res.status(201).json({
      user: publicUser(created),
      emailDelivered: delivery.delivered,
      verificationRequired: true,
    });
  } catch (error) {
    sendError(res, error);
  }
});

// ── Login ────────────────────────────────────────────────────────────────────

router.post("/login", createIpRateLimiter(LOGIN_ATTEMPTS), async (req, res) => {
  try {
    const input = LoginBody.parse(req.body);
    const email = input.email.trim().toLowerCase();

    // Account-keyed attempt cap is consumed BEFORE the lookup so unknown
    // addresses occupy the same bucket as real ones (enumeration-safe), and
    // it is reset after every successful login (time-bounded, never
    // permanent). Same generic 429 as the per-IP limit.
    const attempts = await consumeLimit(LOGIN_ACCOUNT_FAILURES, emailAccountKey(email));
    if (!attempts.allowed) {
      sendTooMany(res, attempts.retryAfterSeconds);
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (!user) {
      // Burn comparable Argon2 time so unknown-email responses have a similar
      // timing profile to wrong-password responses. The hash below verifies
      // the fixed string "timing-equalizer" and never matches real input.
      await verifyPassword(
        "$argon2id$v=19$m=19456,t=2,p=1$c29tZXNhbHRzb21lc2FsdA$qFYaYF5lNkXuokEFtq5wctkK5t0PpGxFJLECBfLEcmo",
        input.password,
      );
      throw new HttpError(401, "invalid_credentials", "Invalid email or password.");
    }

    const ok = await verifyPassword(user.passwordHash, input.password);
    if (!ok) throw new HttpError(401, "invalid_credentials", "Invalid email or password.");

    // Password is correct — a brute-forcer can no longer be probing this
    // account: purge the shared attempt counter so the real user's next
    // sign-in (or an email they later need to verify) starts from zero.
    await clearLimit(LOGIN_ACCOUNT_FAILURES, emailAccountKey(email));

    if (!user.emailVerified) {
      throw new HttpError(403, "email_not_verified", "Verify your email before signing in. Check your inbox for the link.");
    }

    const session = await createSession(user.id);
    setSessionCookie(res, session.id, session.expiresAt, req);

    res.json({ user: publicUser(user) });
  } catch (error) {
    sendError(res, error);
  }
});

// ── Logout ───────────────────────────────────────────────────────────────────

router.post("/logout", async (_req, res) => {
  try {
    await destroyCurrentSession(_req, res);
    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
});

// ── Me ───────────────────────────────────────────────────────────────────────

router.get("/me", async (req, res) => {
  try {
    const found = await getSessionUser(req);
    if (!found) {
      res.status(401).json({ error: "unauthorized", message: "Authentication required." });
      return;
    }
    res.json({ user: publicUser(found.user) });
  } catch (error) {
    sendError(res, error);
  }
});

// ── Verify email ─────────────────────────────────────────────────────────────

router.post("/verify", createIpRateLimiter(TOKEN_GUESS_ATTEMPTS), async (req, res) => {
  try {
    const input = VerifyEmailBody.parse(req.body);
    const result = await consumeToken(input.token);

    if (!result.ok) {
      // One safe message for invalid/expired/used — never which.
      throw new HttpError(400, "invalid_token", "This verification link is invalid or has expired.");
    }

    const [updated] = await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, result.userId))
      .returning();

    if (!updated) throw new HttpError(400, "invalid_token", "This verification link is invalid or has expired.");

    res.json({ user: publicUser(updated) });
  } catch (error) {
    sendError(res, error);
  }
});

// ── Resend verification ──────────────────────────────────────────────────────

router.post("/resend-verification", createIpRateLimiter(RESEND_ATTEMPTS), async (req, res) => {
  try {
    const input = ForgotPasswordBody.parse(req.body);
    const email = input.email.trim().toLowerCase();

    // Per-account (normalized submitted email) cap, keyed and consumed before
    // any existence branch so real/unknown/verified addresses are
    // indistinguishable — enumeration-safe and shared across API instances.
    const accountOutcome = await consumeLimit(RESEND_ACCOUNT, emailAccountKey(email));
    if (!accountOutcome.allowed) {
      sendTooMany(res, accountOutcome.retryAfterSeconds);
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Identical response when the account is missing, already verified, or
    // real — account existence is not enumerable from this endpoint.
    if (user && !user.emailVerified) {
      const { token } = await issueToken(user.id);
      const verifyUrl = `${appBaseUrl(req)}/verify?token=${encodeURIComponent(token)}`;
      await sendEmail({ ...verificationEmail(user.name, verifyUrl), to: user.email });
    }

    res.json({ status: "accepted", emailDelivered: isEmailDeliveryConfigured() });
  } catch (error) {
    sendError(res, error);
  }
});

// ── Forgot password ──────────────────────────────────────────────────────────

router.post("/forgot-password", createIpRateLimiter(FORGOT_ATTEMPTS), async (req, res) => {
  try {
    const input = ForgotPasswordBody.parse(req.body);
    const email = input.email.trim().toLowerCase();

    // Per-account cap on normalized submitted email, keyed before the lookup
    // (enumeration-safe across API instances — same rationale as resend).
    const accountOutcome = await consumeLimit(FORGOT_ACCOUNT, emailAccountKey(email));
    if (!accountOutcome.allowed) {
      sendTooMany(res, accountOutcome.retryAfterSeconds);
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (user) {
      const { token } = await issueToken(user.id);
      const resetUrl = `${appBaseUrl(req)}/reset-password?token=${encodeURIComponent(token)}`;
      await sendEmail({ ...passwordResetEmail(user.name, resetUrl), to: user.email });
    }

    res.json({ status: "accepted", emailDelivered: isEmailDeliveryConfigured() });
  } catch (error) {
    sendError(res, error);
  }
});

// ── Reset password ───────────────────────────────────────────────────────────

router.post("/reset-password", createIpRateLimiter(TOKEN_GUESS_ATTEMPTS), async (req, res) => {
  try {
    const input = ResetPasswordBody.parse(req.body);
    const result = await consumeToken(input.token);

    if (!result.ok) {
      throw new HttpError(400, "invalid_token", "This reset link is invalid or has expired.");
    }

    const passwordHash = await hashPassword(input.password);
    const [updated] = await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, result.userId))
      .returning();

    if (!updated) throw new HttpError(400, "invalid_token", "This reset link is invalid or has expired.");

    // Password changed: revoke every existing session for the account.
    await db.delete(sessions).where(eq(sessions.userId, updated.id));

    // If the requester was signed in on this device, end that session too.
    await destroyCurrentSession(req, res);

    res.json({
      status: "ok",
      message: "Your password has been updated. Please sign in with your new password.",
    });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
