import { Router, type IRouter, type Request } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { sessions, users } from "@workspace/db/schema";
import {
  LoginBody,
  ForgotPasswordBody,
  RegisterBody,
  ResetPasswordBody,
  VerifyEmailBody,
} from "@workspace/api-zod";
import { HttpError, sendError } from "../lib/errors";
import { hashPassword, verifyPassword } from "../lib/password";
import { issueToken, consumeToken, consumeAllTokens } from "../lib/tokens";
import { isEmailDeliveryConfigured, sendEmail, verificationEmail, passwordResetEmail } from "../lib/email";
import {
  createSession,
  destroyCurrentSession,
  getSessionUser,
  setSessionCookie,
} from "../lib/session";

const router: IRouter = Router();

/**
 * Fixed-window in-memory rate limiter for the two abusable email endpoints
 * (5 requests / 15 min / IP). Stops unlimited resend/reset floods; swap in a
 * shared-store limiter if the API ever scales horizontally.
 */
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const rateBuckets = new Map<string, number[]>();

function rateLimited(key: string, now = Date.now()): boolean {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = (rateBuckets.get(key) ?? []).filter((stamp) => stamp > cutoff);
  if (recent.length >= RATE_LIMIT_MAX) {
    rateBuckets.set(key, recent);
    return true;
  }
  rateBuckets.set(key, [...recent, now]);
  return false;
}

function tooMany(res: import("express").Response): void {
  res.status(429).json({ error: "rate_limited", message: "Too many requests. Please wait a few minutes." });
}

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

router.post("/register", async (req, res) => {
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

router.post("/login", async (req, res) => {
  try {
    const input = LoginBody.parse(req.body);
    const email = input.email.trim().toLowerCase();

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

router.post("/verify", async (req, res) => {
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

router.post("/resend-verification", async (req, res) => {
  try {
    const input = ForgotPasswordBody.parse(req.body);
    const email = input.email.trim().toLowerCase();

    if (rateLimited(`resend:${req.ip ?? "unknown"}`)) {
      tooMany(res);
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

router.post("/forgot-password", async (req, res) => {
  try {
    const input = ForgotPasswordBody.parse(req.body);
    const email = input.email.trim().toLowerCase();

    if (rateLimited(`forgot:${req.ip ?? "unknown"}`)) {
      tooMany(res);
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

router.post("/reset-password", async (req, res) => {
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
