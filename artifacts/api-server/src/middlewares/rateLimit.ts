import { Redis } from "@upstash/redis";
import crypto from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Shared, Redis-backed fixed-window rate limiter for the authentication
 * endpoints.
 *
 * Design notes (see PR description / repo audit notes):
 * - Production limiter state lives in Upstash Redis (shared across all Vercel
 *   serverless instances) — NOT in an in-memory Map, which dies with each
 *   warm serverless container.
 * - The Redis client is created lazily (first limiter use) and only when BOTH
 *   confirmed read-write env vars are present. The read-only Upstash token is
 *   never used here: this limiter writes (INCR/PEXPIRE/DEL).
 * - Every limiter window is an atomic Lua INCR with TTL repair, so two or more
 *   API instances sharing the same database count against the exact same key.
 * - Failure mode: fail-open with a loud structured error per backend failure.
 *   A Redis outage must never take sign-in down, but it is never reported as
 *   "active protection": when the Redis config or backend is unavailable,
 *   limiter decisions pass through AND a `rate_limiter_...` log line records
 *   the degraded state for the operator.
 * - Keys are prefixed (`rl:...`). Account keys hash the normalized email
 *   with SHA-256 so no mailbox text is ever stored in Redis keys.
 */

/** Confirmed read-write pair wired to the Vercel project by the Upstash integration. */
const REDIS_URL_ENV = "UPSTASH_REDIS_REST_KV_REST_API_URL";
const REDIS_TOKEN_ENV = "UPSTASH_REDIS_REST_KV_REST_API_TOKEN";

// UPSTASH_REDIS_REST_KV_REST_API_READ_ONLY_TOKEN is deliberately NOT referenced
// here. The limiter performs writes (INCR/PEXPIRE/DEL) and would fail against
// it anyway (ERR read-only); never initialize a limiter with it.

/**
 * undefined = client not built yet (lazily), null = configuration missing (fail-open).
 * Per warm serverless instance: one Upstash REST client, no per-request churn.
 */
let redisClient: Redis | null | undefined;
let disabledLogged = false;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env[REDIS_URL_ENV];
  const token = process.env[REDIS_TOKEN_ENV];
  // Lazy and conditional initialization: no Redis connection attempt (and no
  // crash) in local dev or pruned envs; the limiter simply fails open with a
  // loud one-time warning so "silent protection" can never be assumed.
  if (!url || !token) {
    redisClient = null;
    if (!disabledLogged) {
      disabledLogged = true;
      console.warn(
        JSON.stringify({
          event: "rate_limiter_disabled_attention_required",
          reason: "missing_configuration",
          expected: [REDIS_URL_ENV, REDIS_TOKEN_ENV],
          effect: "limiter_decision_silent_and_open",
        }),
      );
    }
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

/**
 * Fixed window in a single atomic command (avoids INCR-then-EXPIRE races that
 * could strand a key without TTL and cause a permanent lockout):
 *   count = INCR key; if fresh or TTL-less, PEXPIRE; if count > limit → 429 else allow.
 * Returns {0|1 allowed, PTTL ms} — PTTL drives Retry-After.
 */
const FIXED_WINDOW_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 or redis.call("PTTL", KEYS[1]) < 0 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
if count > tonumber(ARGV[2]) then
  return { 0, ttl }
end
return { 1, ttl }
`;

export interface RateLimitOptions {
  /** Redis key prefix, e.g. "rl:login:ip". Never contains request data. */
  prefix: string;
  /** Number of attempts permitted per window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitOutcome {
  allowed: boolean;
  /** Seconds until the window resets, when not allowed (ceiling >= 1). */
  retryAfterSeconds: number;
  /** False only when the shared backend was unavailable/disable decision was forced open. */
  enforced: boolean;
}

const OPEN_ALLOWED: RateLimitOutcome = { allowed: true, retryAfterSeconds: 0, enforced: false };

/**
 * Consume one attempt from the shared fixed window keyed by `key`.
 * Never throws on backend errors: fail-open with one structured error log
 * (message text only — never request data), so an outage is explicit, not silent.
 */
export async function consumeLimit(options: RateLimitOptions, key: string): Promise<RateLimitOutcome> {
  const client = getRedis();
  if (!client) return OPEN_ALLOWED;

  const redisKey = `${options.prefix}:${key}`;
  try {
    const result = (await client.eval(
      FIXED_WINDOW_SCRIPT,
      [redisKey],
      [String(options.windowMs), String(options.limit)],
    )) as Array<number | string>;
    const allowed = Number(result[0]) === 1;
    const ttlMs = Number(result[1]);
    return {
      allowed,
      retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil(ttlMs / 1000)),
      enforced: true,
    };
  } catch (cause) {
    console.error(
      JSON.stringify({
        event: "rate_limit_backend_error",
        state: "fail_open_protection_not_active",
        message: cause instanceof Error ? cause.message : String(cause),
      }),
    );
    return OPEN_ALLOWED;
  }
}

/** Purge the attempt counter for a key (success-path reset). Best-effort: failures logged, never thrown. */
export async function clearLimit(options: RateLimitOptions, key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(`${options.prefix}:${key}`);
  } catch (cause) {
    console.error(
      JSON.stringify({
        event: "rate_limit_backend_error",
        state: "counter_reset_failed",
        message: cause instanceof Error ? cause.message : String(cause),
      }),
    );
  }
}

// ── Key derivation ────────────────────────────────────────────────────────────

/**
 * Client IP for per-IP keys.
 *
 * Vercel overwrites `x-forwarded-for` with the client's public IP "to prevent
 * IP spoofing" (https://vercel.com/docs/headers/request-headers) — client-supplied
 * values never survive to this API. `x-vercel-forwarded-for` carries the same
 * value and is preferred as the canonical one in case a proxy above Vercel
 * rewrote plain `x-forwarded-for`. LEFT-most value (original client) when a
 * chain appears. Falls back to Express `req.ip` (trust proxy = 1 in app.ts),
 * then a non-spoofable shared bucket — which is why the email/account limiters
 * exist; see the PR notes for the remaining IP-keying caveats.
 */
export function clientIpKey(req: Request): string {
  const forwarded =
    req.header("x-vercel-forwarded-for") ?? req.header("x-forwarded-for") ?? "";
  const first = forwarded.split(",")[0]?.trim();
  if (first) return first;
  return req.ip ?? "unknown";
}

/** Normalized submitted email → stable opaque Redis key fragment (no PII in Redis keys/logs). */
export function emailAccountKey(email: string): string {
  const normalized = email.trim().toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 32);
}

// ── Response handling ─────────────────────────────────────────────────────────

/**
 * Identical 429 body for every limiter and every client (generic — no hint of
 * which key tripped, so account/state is not enumerable), plus Retry-After.
 */
export function sendTooMany(res: Response, retryAfterSeconds: number): void {
  if (!res.headersSent) {
    res.setHeader("Retry-After", String(Math.max(1, Math.ceil(retryAfterSeconds))));
    res.status(429).json({
      error: "rate_limited",
      message: "Too many requests. Please try again later.",
    });
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────

/**
 * Per-IP fixed-window middleware. Same shape used by email-keyed checks so the
 * handler code reads uniformly; `req.ip` AND header extraction documented above.
 */
export function createIpRateLimiter(options: RateLimitOptions): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const outcome = await consumeLimit(options, clientIpKey(req));
    if (outcome.allowed) {
      next();
      return;
    }
    sendTooMany(res, outcome.retryAfterSeconds);
  };
}
