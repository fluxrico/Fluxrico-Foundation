import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Faithful shared-store mock of @upstash/redis.
 *
 * The fake reproduces the exact Lua semantics the limiter depends on
 * (INCR with PEXPIRE-on-create/repair + PTTL) against a single in-memory
 * store. The store lives on `globalThis` so it SURVIVES `vi.resetModules()`
 * — which is how two limiter instances (fresh module registries, as separate
 * warm serverless instances would be) demonstrably share one Redis database.
 * Time runs on a controllable clock so window expiry can be asserted.
 */

interface GeoEntry {
  count: number;
  expireAtMs: number | null;
}

type FakeStore = Map<string, GeoEntry>;

interface FakeSharedState {
  store: FakeStore;
  clock: FakeClock;
  /** Non-null ⇒ every limiter command rejects (simulated Redis outage). */
  failEval: Error | null;
}

interface FakeClock {
  nowMs: number;
}

function readSharedState(): FakeSharedState {
  const g = globalThis as typeof globalThis & {
    __rateLimitFakeStore?: FakeStore;
    __rateLimitFakeClock?: FakeClock;
    __rateLimitFakeFail?: Error | null;
  };
  g.__rateLimitFakeStore ??= new Map<string, GeoEntry>();
  g.__rateLimitFakeClock ??= { nowMs: 1_000_000 };
  g.__rateLimitFakeFail ??= null;
  return { store: g.__rateLimitFakeStore, clock: g.__rateLimitFakeClock, failEval: g.__rateLimitFakeFail };
}

function evalFixedWindow(store: FakeStore, clock: FakeClock, key: string, windowMs: string, limit: string): [number, number] {
  const entry = store.get(key) ?? { count: 0, expireAtMs: null };
  // Expired windows behave as a fresh key (PTTL < 0 branch in the Lua script).
  if (entry.expireAtMs !== null && entry.expireAtMs <= clock.nowMs) {
    store.delete(key);
  }
  const current = store.get(key) ?? { count: 0, expireAtMs: null };
  const count = current.count + 1;
  let expireAtMs = current.expireAtMs;
  // INCR-created or TTL-less key → (re)set the window exactly like the script.
  if (expireAtMs === null || count === 1) {
    expireAtMs = clock.nowMs + Number(windowMs);
  }
  store.set(key, { count, expireAtMs });
  const ttl = Math.max(0, expireAtMs - clock.nowMs);
  if (count > Number(limit)) return [0, ttl];
  return [1, ttl];
}

interface RedisCtorArgs {
  url: string;
  token: string;
}

vi.mock("@upstash/redis", () => {
  class Redis {
    constructor(args: RedisCtorArgs) {
      if (!args.url || !args.token) throw new Error("missing_upstash_config");
    }

    async eval(
      script: string,
      keys: string[],
      args: string[],
    ): Promise<unknown> {
      if (readSharedState().failEval) throw readSharedState().failEval;
      if (script.includes("INCR")) {
        return evalFixedWindow(
          readSharedState().store,
          readSharedState().clock,
          keys[0],
          args[0],
          args[1],
        );
      }
      throw new Error(`fake_eval_unsupported_script: ${script.slice(0, 40)}`);
    }

    async del(key: string): Promise<number> {
      if (readSharedState().failEval) throw readSharedState().failEval;
      return readSharedState().store.delete(key) ? 1 : 0;
    }
  }
  return { Redis };
});

function freshLimiterModule() {
  // Fresh module registry ≙ a second warm API instance sharing the same Redis.
  vi.resetModules();
  return import("../middlewares/rateLimit.js");
}

// Enforcement tests need both confirmed read-write env vars present; fake
// credentials only — the fake Redis backend never inspects them.
function grantFakeUpstashConfig(): void {
  process.env.UPSTASH_REDIS_REST_KV_REST_API_URL = "https://fake-upstash.example.com";
  process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN = "test-only-token-not-a-secret";
}

describe("shared Redis-backed rate limiter", () => {
  beforeEach(() => {
    // Enforcement tests need both confirmed read-write env vars present; fake
    // credentials only — the fake Redis backend never inspects them.
    grantFakeUpstashConfig();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("limiter is enforced: allows up to limit, then 429 with Retry-After derived from the window", async () => {
    const { store } = readSharedState();
    store.clear();
    const limiter = await freshLimiterModule();

    for (let i = 0; i < 5; i += 1) {
      const outcome = await limiter.consumeLimit(
        { prefix: "rl:test:ip", limit: 5, windowMs: 15 * 60 * 1000 },
        "203.0.113.9",
      );
      expect(outcome.allowed).toBe(true);
      expect(outcome.enforced).toBe(true);
    }
    const blocked = await limiter.consumeLimit(
      { prefix: "rl:test:ip", limit: 5, windowMs: 15 * 60 * 1000 },
      "203.0.113.9",
    );
    expect(blocked.allowed).toBe(false);
    expect(blocked.enforced).toBe(true);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(15 * 60);
  });

  it("independent keys are independent", async () => {
    const { store } = readSharedState();
    store.clear();
    const limiter = await freshLimiterModule();
    const options = { prefix: "rl:test:ip", limit: 2, windowMs: 60_000 };

    await limiter.consumeLimit(options, "198.51.100.1");
    await limiter.consumeLimit(options, "198.51.100.1");
    const ip1Blocked = await limiter.consumeLimit(options, "198.51.100.1");
    expect(ip1Blocked.allowed).toBe(false);

    const ip2 = await limiter.consumeLimit(options, "198.51.100.2");
    expect(ip2.allowed).toBe(true);

    const otherEndpoint = await limiter.consumeLimit(
      { prefix: "rl:other:ip", limit: 2, windowMs: 60_000 },
      "198.51.100.1",
    );
    expect(otherEndpoint.allowed).toBe(true);
  });

  it("windows expire: after the window the key is automatically usable again", async () => {
    const { store, clock } = readSharedState();
    store.clear();
    clock.nowMs = 1_000_000;
    const limiter = await freshLimiterModule();
    const options = { prefix: "rl:test:ip", limit: 1, windowMs: 60_000 };

    expect((await limiter.consumeLimit(options, "10.0.0.1")).allowed).toBe(true);
    expect((await limiter.consumeLimit(options, "10.0.0.1")).allowed).toBe(false);

    clock.nowMs = 1_060_001;
    expect((await limiter.consumeLimit(options, "10.0.0.1")).allowed).toBe(true);
  });

  it("successful-login recovery: clearLimit purges the counter so failures start from zero", async () => {
    const { store } = readSharedState();
    store.clear();
    const limiter = await freshLimiterModule();
    const options = { prefix: "rl:login:email", limit: 3, windowMs: 60_000 };
    const key = limiter.emailAccountKey("User@Example.COM");
    // Normalized + hashed, no email text in keys:
    expect(key).toBe(limiter.emailAccountKey("user@example.com"));
    expect(key).not.toContain("@");

    await limiter.consumeLimit(options, key);
    await limiter.consumeLimit(options, key);
    await limiter.consumeLimit(options, key);
    expect((await limiter.consumeLimit(options, key)).allowed).toBe(false);

    await limiter.clearLimit(options, key);
    expect((await limiter.consumeLimit(options, key)).allowed).toBe(true);
  });

  it("two limiter instances (fresh module registries) share the same counters", async () => {
    const { store } = readSharedState();
    store.clear();
    const options = { prefix: "rl:shared:ip", limit: 3, windowMs: 60_000 };

    const instanceA = await freshLimiterModule();
    const a1 = await instanceA.consumeLimit(options, "192.0.2.55");
    const a2 = await instanceA.consumeLimit(options, "192.0.2.55");
    expect(a1.allowed).toBe(true);
    expect(a2.allowed).toBe(true);

    const instanceB = await freshLimiterModule();
    const b3 = await instanceB.consumeLimit(options, "192.0.2.55");
    expect(b3.allowed).toBe(true);
    const b4 = await instanceB.consumeLimit(options, "192.0.2.55");
    expect(b4.allowed).toBe(false);
  });

  it("no shared backend → fail-open with an explicit disabled log (protection NOT silently claimed)", async () => {
    const { store } = readSharedState();
    store.clear();
    const savedUrl = process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
    const savedToken = process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
    delete process.env.UPSTASH_REDIS_REST_KV_REST_API_URL;
    delete process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const limiter = await freshLimiterModule();

    const outcome = await limiter.consumeLimit(
      { prefix: "rl:test:ip", limit: 1, windowMs: 60_000 },
      "203.0.113.9",
    );
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL = savedUrl;
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN = savedToken;
    // Open, but loudly disabled — the operator must be able to tell.
    expect(outcome.allowed).toBe(true);
    expect(outcome.enforced).toBe(false);
    expect(warn).toHaveBeenCalledTimes(1);
    const logged = String(warn.mock.calls[0][0]);
    expect(logged).toContain("rate_limiter_disabled_attention_required");
    // Strict no-leak check: the log is exactly the four known safe fields —
    // env-var NAMES only, no tokens, no request data.
    const parsed: Record<string, unknown> = JSON.parse(logged);
    expect(Object.keys(parsed).sort()).toEqual(["effect", "event", "expected", "reason"]);
    expect(parsed.expected).toEqual([
      "UPSTASH_REDIS_REST_KV_REST_API_URL",
      "UPSTASH_REDIS_REST_KV_REST_API_TOKEN",
    ]);
  });

  it("Redis outage → fail-through with structured error log, never a thrown request failure", async () => {
    const { store } = readSharedState();
    store.clear();
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL = "https://fake-upstash.example.com";
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN = "test-only-token-not-a-secret";
    vi.resetModules();
    // Set/clear outage through the global handle readSharedState() wraps
    // (the wrapper object itself is a copy, not the source of truth).
    const g = globalThis as typeof globalThis & { __rateLimitFakeFail?: Error | null };
    g.__rateLimitFakeFail = new Error("ECONNRESET");

    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const limiter = await freshLimiterModule();

    // failEval stays active THROUGH the consume: the eval itself must reject.
    const outcome = await limiter.consumeLimit(
      { prefix: "rl:test:ip", limit: 1, windowMs: 60_000 },
      "203.0.113.9",
    );
    g.__rateLimitFakeFail = null;

    expect(outcome.allowed).toBe(true);
    expect(outcome.enforced).toBe(false);
    expect(error).toHaveBeenCalledTimes(1);
    const logged = String(error.mock.calls[0][0]);
    expect(logged).toContain("rate_limit_backend_error");
    expect(logged).toContain("ECONNRESET");
  });

  it("emailAccountKey is deterministic, normalized, bounded length and opaque", async () => {
    const limiter = await freshLimiterModule();
    const k1 = limiter.emailAccountKey("  USER+tag@EXAMPLE.com ");
    expect(k1).toMatch(/^[a-f0-9]{32}$/);
    expect(k1).toBe(limiter.emailAccountKey("user+tag@example.com"));
    expect(k1).not.toBe(limiter.emailAccountKey("other@example.com"));
  });
});
