import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq, gt, ne } from "drizzle-orm";
import { db } from "@workspace/db";
import { sessions, userJourney, userSubscriptions, users } from "@workspace/db/schema";
import { ChangePasswordBody, UpdateAccountBody } from "@workspace/api-zod";
import { requireUser, getSessionUser } from "../lib/session";import { hashPassword, verifyPassword } from "../lib/password";
import { clearSessionCookie, destroyCurrentSession } from "../lib/session";
import { resolveSubscription } from "../lib/subscription";
import { sendError, HttpError } from "../lib/errors";

/**
 * Account self-service routes.
 *
 * Every route resolves identity from the session cookie only (requireUser);
 * nothing is accepted from the request about who the caller is. Password
 * changes verify the current password first, rehash with current Argon2
 * parameters, and revoke every OTHER session (the current device stays
 * signed in). Deletion removes the user row — every dependent row
 * (sessions, tokens, subscription, journey) disappears via ON DELETE
 * CASCADE — and ends the current session.
 */

const router: IRouter = Router();

// ── PATCH /api/account/me — update the display name ──────────────────────────

router.patch("/account/me", async (req: Request, res: Response) => {
  try {
    const user = await requireUser(req, res, { requireVerified: true });
    if (!user) return;

    const input = UpdateAccountBody.parse(req.body);
    const name = input.name.trim();

    const [updated] = await db
      .update(users)
      .set({ name, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning({ id: users.id, name: users.name, email: users.email, emailVerified: users.emailVerified });

    if (!updated) throw new HttpError(500, "internal_error", "Could not update your details. Please try again.");

    res.json({ user: updated });
  } catch (error) {
    sendError(res, error);
  }
});

// ── POST /api/account/password — change password (current password required) ─

router.post("/account/password", async (req: Request, res: Response) => {
  try {
    const user = await requireUser(req, res, { requireVerified: true });
    if (!user) return;

    const input = ChangePasswordBody.parse(req.body);

    const [row] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!row) throw new HttpError(401, "unauthorized", "Authentication required.");

    const ok = await verifyPassword(row.passwordHash, input.currentPassword);
    if (!ok) {
      throw new HttpError(400, "wrong_password", "Your current password is incorrect.");
    }
    if (input.currentPassword === input.newPassword) {
      throw new HttpError(400, "same_password", "Choose a password different from your current one.");
    }

    const passwordHash = await hashPassword(input.newPassword);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));

    // Revoke every OTHER session; the current device stays signed in.
    const current = await getSessionUser(req);
    const revoked = await db
      .delete(sessions)
      .where(and(eq(sessions.userId, user.id), ne(sessions.id, current?.session.id ?? "")))
      .returning({ id: sessions.id });

    res.json({ status: "ok", message: "Your password has been changed.", revokedOtherSessions: revoked.length });
  } catch (error) {
    sendError(res, error);
  }
});

// ── GET /api/account/sessions — list active sessions (metadata only) ─────────

router.get("/account/sessions", async (req: Request, res: Response) => {
  try {
    const user = await requireUser(req, res, { requireVerified: true });
    if (!user) return;

    const current = await getSessionUser(req);
    const rows = await db
      .select({ id: sessions.id, createdAt: sessions.createdAt, expiresAt: sessions.expiresAt })
      .from(sessions)
      .where(and(eq(sessions.userId, user.id), gt(sessions.expiresAt, new Date())))
      .orderBy(desc(sessions.createdAt));

    res.json({
      sessions: rows.map((row) => ({
        id: row.id,
        current: current != null && row.id === current.session.id,
        createdAt: row.createdAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
      })),
    });
  } catch (error) {
    sendError(res, error);
  }
});

// ── DELETE /api/account/sessions/others — revoke every other session ─────────

router.delete("/account/sessions/others", async (req: Request, res: Response) => {
  try {
    const user = await requireUser(req, res, { requireVerified: true });
    if (!user) return;

    const current = await getSessionUser(req);
    const revoked = await db
      .delete(sessions)
      .where(and(eq(sessions.userId, user.id), ne(sessions.id, current?.session.id ?? "")))
      .returning({ id: sessions.id });

    res.json({ status: "ok", revoked: revoked.length });
  } catch (error) {
    sendError(res, error);
  }
});

// ── GET /api/account/export — the account's data as one JSON document ────────

router.get("/account/export", async (req: Request, res: Response) => {
  try {
    const user = await requireUser(req, res, { requireVerified: true });
    if (!user) return;

    const [subscription, journey, billingRow] = await Promise.all([
      resolveSubscription(user.id),
      db.select({ payload: userJourney.payload }).from(userJourney).where(eq(userJourney.userId, user.id)).limit(1),
      db
        .select({
          customerId: userSubscriptions.billingCustomerId,
          subscriptionId: userSubscriptions.billingSubscriptionId,
        })
        .from(userSubscriptions)
        .where(eq(userSubscriptions.userId, user.id))
        .limit(1),
    ]);

    res.json({
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt.toISOString(),
      },
      subscription,
      journey: journey[0]?.payload ?? null,
      billing: {
        customerId: billingRow[0]?.customerId ?? null,
        subscriptionId: billingRow[0]?.subscriptionId ?? null,
      },
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    sendError(res, error);
  }
});

// ── DELETE /api/account — delete the account and all of its data ─────────────

router.delete("/account", async (req: Request, res: Response) => {
  try {
    const user = await requireUser(req, res, { requireVerified: true });
    if (!user) return;

    await db.delete(users).where(eq(users.id, user.id));
    await destroyCurrentSession(req, res);

    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
