import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@workspace/db";
import { userJourney } from "@workspace/db/schema";
import { requireUser } from "../lib/session";
import { sendError, HttpError } from "../lib/errors";
import { SaveJourneyBody, type JourneySaveRequest } from "@workspace/api-zod";

/**
 * Journey persistence routes — the server-side home of workspace state.
 *
 * The frontend keeps its single shared in-session state system; this route is
 * where that state lives between sessions. Nothing here computes journey
 * semantics: the client derives stage/progress/activity from the payload it
 * saved, and this layer only guarantees that what is stored is complete,
 * shape-valid, and owned by the authenticated user.
 */

const router: IRouter = Router();

/** Hard ceiling on the serialized payload (defence in depth beside the 413). */
const MAX_PAYLOAD_BYTES = 512 * 1024;

function payloadTooLarge(value: unknown): boolean {
  try {
    return JSON.stringify(value).length > MAX_PAYLOAD_BYTES;
  } catch {
    return true;
  }
}

// ── GET /api/journey — load the user's persisted workspace state ─────────────

router.get("/journey", async (req: Request, res: Response) => {
  try {
    const user = await requireUser(req, res, { requireVerified: true });
    if (!user) return;

    const [row] = await db
      .select({ payload: userJourney.payload })
      .from(userJourney)
      .where(eq(userJourney.userId, user.id))
      .limit(1);

    res.json({ journey: row?.payload ?? null });
  } catch (error) {
    sendError(res, error);
  }
});

// ── PUT /api/journey — validate and store the workspace snapshot ─────────────

router.put("/journey", async (req: Request, res: Response) => {
  try {
    const user = await requireUser(req, res, { requireVerified: true });
    if (!user) return;

    if (payloadTooLarge(req.body)) {
      throw new HttpError(413, "payload_too_large", "This journey snapshot is too large to save.");
    }

    // Server-side shape enforcement: the stored payload is always complete
    // and schema-valid, so any consumer can trust it wholesale.
    const payload = SaveJourneyBody.parse(req.body) as unknown as JourneySaveRequest;

    const savedAt = new Date();
    await db
      .insert(userJourney)
      .values({ userId: user.id, payload, updatedAt: savedAt })
      .onConflictDoUpdate({
        target: userJourney.userId,
        set: { payload, updatedAt: savedAt },
      });

    res.json({ status: "ok", savedAt: savedAt.toISOString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: "invalid_journey",
        message: "This journey snapshot is missing required fields or has invalid values.",
      });
      return;
    }
    sendError(res, error);
  }
});

export default router;
