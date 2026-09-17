import { Router, type IRouter, type Request, type Response } from "express";
import { requireUser } from "../lib/session";
import { requireProAccess } from "./subscription";
import { sendError, HttpError } from "../lib/errors";
import {
  createPortalSession,
  findCustomerIdForUser,
  resolvePriceIds,
  paddleClientConfigured,
  paddleServerConfigured,
  paddleEnv,
} from "../lib/paddle";
import { handlePaddleWebhook } from "../lib/billing";
import { fetchSubscription } from "../lib/paddle";

/**
 * Billing routes (Phase 2: Paddle).
 *
 * - GET /api/billing/config — frontend-safe Paddle configuration: client
 *   token, environment, real price IDs (env config or live discovery), and an
 *   honest checkout-availability verdict. Nothing secret is included.
 * - POST /api/billing/portal-session — creates a Paddle customer portal
 *   session for the signed-in user's linked customer. Requires a verified
 *   session AND Pro access (users without active Pro have nothing to manage;
 *   checkout is their path).
 * - POST /api/billing/webhook — Paddle notification receiver. Verifies the
 *   official Paddle signature over the raw request body, then applies events
 *   idempotently via the billing webhook ledger.
 */

const router: IRouter = Router();

type PriceIds = { monthly: string | null; yearly: string | null };

function checkoutUnavailableReason(priceIds: PriceIds): string {
  if (!paddleClientConfigured()) return "client_token_missing";
  if (!paddleServerConfigured()) return "api_key_missing";
  if (priceIds.monthly == null) return "price_monthly_unresolved";
  if (priceIds.yearly == null) return "price_yearly_unresolved";
  return "unknown";
}

// ── GET /api/billing/config — frontend-safe Paddle configuration ────────────

router.get("/billing/config", async (req, res) => {
  try {
    const user = await requireUser(req, res, { requireVerified: true });
    if (!user) return;

    let priceIds: PriceIds = { monthly: null, yearly: null };
    if (paddleServerConfigured()) {
      try {
        priceIds = await resolvePriceIds();
      } catch {
        // Discovery failed (provider unreachable); stay honest, never guess.
        priceIds = { monthly: null, yearly: null };
      }
    }
    const checkoutAvailable =
      paddleClientConfigured() && paddleServerConfigured() && priceIds.monthly != null && priceIds.yearly != null;

    res.json({
      billing: {
        provider: "paddle",
        environment: paddleEnv(),
        clientToken: (process.env.PADDLE_CLIENT_TOKEN ?? "").trim() || null,
        prices: {
          monthly: priceIds.monthly,
          yearly: priceIds.yearly,
        },
        checkoutAvailable,
        reason: checkoutAvailable ? null : checkoutUnavailableReason(priceIds),
      },
    });
  } catch (error) {
    sendError(res, error);
  }
});

// ── POST /api/billing/portal-session — Paddle customer portal for Pro users ─

router.post("/billing/portal-session", async (req, res) => {
  try {
    const user = await requireProAccess(req, res);
    if (!user) return;

    const customerId = await findCustomerIdForUser(user.id);
    if (customerId == null) {
      throw new HttpError(
        409,
        "billing_not_linked",
        "Your account isn't linked to a billing profile yet. Complete a checkout first.",
      );
    }

    let url: string | null = null;
    try {
      url = await createPortalSession(customerId);
    } catch {
      // Provider unreachable / rejected: user-friendly 502, no internals.
      url = null;
    }
    if (url == null) {
      throw new HttpError(
        502,
        "portal_unavailable",
        "Paddle couldn't start a billing session right now. Please try again shortly.",
      );
    }

    res.json({ status: "ok", url });
  } catch (error) {
    sendError(res, error);
  }
});

// ── POST /api/billing/webhook — verified, idempotent Paddle notifications ───

router.post("/billing/webhook", async (req, res) => {
  try {
    // express.json()'s verify callback (see app.ts) stashes the exact bytes
    // Paddle signed; fall back to the re-serialized body only as a last
    // resort (signatures will not match then — by design).
    const rawBody =
      typeof (req as Request & { rawBody?: string }).rawBody === "string"
        ? (req as Request & { rawBody?: string }).rawBody!
        : JSON.stringify(req.body ?? {});

    const result = await handlePaddleWebhook(rawBody, req.header("Paddle-Signature"));
    if (!result.ok) {
      res.status(result.status).json({
        error: result.status === 400 ? "invalid_signature" : "webhook_error",
        message:
          result.status === 400
            ? "Signature verification failed."
            : "Could not process this event; it will be retried.",
      });
      return;
    }
    res.status(200).json({ status: "ok" });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
