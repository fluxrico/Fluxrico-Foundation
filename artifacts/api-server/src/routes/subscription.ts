import { Router, type IRouter, type Request, type Response } from "express";
import {
  resolveSubscription,
  TRIAL_DAYS,
  type SubscriptionAccess,
} from "../lib/subscription";
import { requireUser } from "../lib/session";
import { sendError } from "../lib/errors";
import type { users } from "@workspace/db/schema";

/**
 * Subscription / access foundation routes.
 *
 * - GET /api/subscription — the authenticated user's access state (the single
 *   shared source for the whole frontend; nothing is computed client-side).
 * - GET /api/pro/insights — the harmless example Pro capability: proves the
 *   Pro guard end-to-end without implementing real future Pro features.
 *
 * Access is derived from the database row + server time on every request.
 * No route in this file reads an "isPro"-style value from the client.
 */

const router: IRouter = Router();

/**
 * Pro-route guard: authenticated + verified + Pro access, resolved strictly
 * server-side. Usage mirrors requireUser:
 *   const user = await requireProAccess(req, res); if (!user) return;
 * Responds 401 / 403 (unverified) / 403 (pro_required) itself.
 */
export async function requireProAccess(
  req: Request,
  res: Response,
): Promise<typeof users.$inferSelect | null> {
  const user = await requireUser(req, res, { requireVerified: true });
  if (!user) return null;

  const access = await resolveSubscription(user.id);
  if (!access.hasProAccess) {
    res.status(403).json({
      error: "pro_required",
      message: "Fluxrico Pro is required for this capability.",
      state: access.state,
      trialDaysRemaining: access.trialDaysRemaining,
    });
    return null;
  }
  return user;
}

/** Shape the API returns for the authenticated user's subscription. */
function serializeSubscription(access: SubscriptionAccess) {
  return {
    state: access.state,
    hasProAccess: access.hasProAccess,
    trialDaysRemaining: access.trialDaysRemaining,
    trialStartedAt: access.trialStartedAt,
    trialEndsAt: access.trialEndsAt,
    trialLengthDays: TRIAL_DAYS,
    plan: access.plan,
    trialEndedAgoMs: access.trialEndedAgoMs ?? null,
  };
}

router.get("/subscription", async (req, res) => {
  try {
    const user = await requireUser(req, res, { requireVerified: true });
    if (!user) return;
    const access = await resolveSubscription(user.id);
    res.json({ subscription: serializeSubscription(access) });
  } catch (error) {
    sendError(res, error);
  }
});

// ── Example Pro capability (foundation proof only) ──────────────────────────

router.get("/pro/insights", async (req, res) => {
  try {
    const user = await requireProAccess(req, res);
    if (!user) return;
    res.json({
      status: "ok",
      capability: "insights",
      message:
        "Pro capability endpoint is wired and guarded. Real insights arrive with a later phase.",
    });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
