/**
 * Paddle.js client integration — official CDN loader with a minimal typed
 * surface. Loaded lazily, once, on first checkout; the client token comes
 * from GET /api/billing/config (never bundled). The API key stays server-side.
 *
 * No npm dependency: Paddle documents the CDN include for Paddle.js v2, and
 * this keeps the bundle free of a vendor script that only one page needs.
 *
 * Lifecycle guarantees (Paddle.js v2):
 * - The script is injected at most once and `Paddle.Initialize()` runs at
 *   most once per page — Paddle errors when Initialize is called again.
 * - Every checkout attempt gets its own event handler; a module-level pointer
 *   routes Paddle's events to the active attempt and is cleared when it
 *   settles, so events can never settle two promises.
 * - `checkout.error` (Paddle's signal that data prevented the checkout from
 *   opening) rejects the promise, and a 15-second opening timeout rejects an
 *   attempt where nothing happens at all — a failed open can no longer leave
 *   the caller waiting forever.
 * - The timeout covers only the opening phase: the first `checkout.loaded`
 *   disarms it, so a real checkout session may take as long as the user
 *   needs; the reliable terminal events settle it afterwards.
 * - Every rejection carries a fixed, user-displayable message; Paddle's raw
 *   event payloads are never surfaced.
 */

type PaddleEnvironmentName = "sandbox" | "live";

type CheckoutResult =
  | { status: "completed"; transactionId?: string }
  | { status: "closed" };

/** Safe, user-displayable failure for checkout attempts. */
export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

/**
 * Opening-phase guard only: fires when the checkout never emits any event at
 * all (a stalled script/init chain, or a failed open Paddle stays silent
 * about). Disarmed exactly once by the first `checkout.loaded`, so a session
 * the user is actively filling in can never hit a false failure.
 */
const CHECKOUT_OPEN_TIMEOUT_MS = 15_000;

const TIMEOUT_MESSAGE = "The checkout took too long to open. Please check your connection and try again.";
const OPEN_ERROR_MESSAGE = "Checkout could not be opened. Please try again in a moment.";

interface PaddleEventBase {
  name: string;
}

interface PaddleCheckoutCompletedEvent extends PaddleEventBase {
  name: "checkout.completed";
  data: { id: string };
}

interface PaddleCheckoutClosedEvent extends PaddleEventBase {
  name: "checkout.closed";
}

/**
 * Paddle reports a failed open through this event. The payload may carry
 * provider internals — it is deliberately unmodeled and never surfaced.
 */
interface PaddleCheckoutErrorEvent extends PaddleEventBase {
  name: "checkout.error";
}

/**
 * Paddle confirms the checkout form opened. Used only to disarm the opening
 * timeout — the payload is deliberately unmodeled and never surfaced.
 */
interface PaddleCheckoutLoadedEvent extends PaddleEventBase {
  name: "checkout.loaded";
}

type PaddleEvent =
  | PaddleCheckoutCompletedEvent
  | PaddleCheckoutClosedEvent
  | PaddleCheckoutErrorEvent
  | PaddleCheckoutLoadedEvent;

interface PaddleCheckoutOptions {
  items: Array<{ priceId: string; quantity: number }>;
  customer?: { email?: string };
  customData?: Record<string, unknown>;
  settings?: {
    displayMode?: "overlay" | "inline";
    theme?: "light" | "dark";
    successUrl?: string;
  };
}

interface PaddleInstance {
  Initialize(options: {
    environment?: PaddleEnvironmentName;
    token?: string;
    eventCallback?: (event: PaddleEvent) => void;
  }): void;
  Checkout: {
    open(options: PaddleCheckoutOptions): void;
  };
}

declare global {
  interface Window {
    Paddle?: PaddleInstance;
  }
}

const PADDLE_JS_URL = "https://cdn.paddle.com/paddle/v2/paddle.js";

let loadPromise: Promise<PaddleInstance> | null = null;

/** Inject the official Paddle.js script once; resolves with the instance. */
export function loadPaddleJs(): Promise<PaddleInstance> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<PaddleInstance>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Paddle.js requires a browser environment."));
      return;
    }
    if (window.Paddle) {
      resolve(window.Paddle);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PADDLE_JS_URL}"]`);
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Paddle) resolve(window.Paddle);
        else reject(new Error("Paddle.js loaded but did not initialize."));
      });
      existing.addEventListener("error", () => reject(new Error("Paddle.js could not be loaded.")));
      return;
    }

    const script = document.createElement("script");
    script.src = PADDLE_JS_URL;
    script.async = true;
    script.addEventListener("load", () => {
      if (window.Paddle) resolve(window.Paddle);
      else reject(new Error("Paddle.js loaded but did not initialize."));
    });
    script.addEventListener("error", () => reject(new Error("Paddle.js could not be loaded.")));
    document.head.appendChild(script);
  });

  return loadPromise;
}

// ── Initialize-once + event routing ──────────────────────────────────────────

let initPromise: Promise<PaddleInstance> | null = null;
let activeEventHandler: ((event: PaddleEvent) => void) | null = null;

/**
 * Get a Paddle instance for the given checkout configuration, initializing
 * exactly once per page. The first attempt's environment/token wins for the
 * whole page lifetime: Paddle forbids a second Initialize, and this module's
 * configuration comes from one server config so it does not change mid-page.
 */
export function ensurePaddleInitialized(options: {
  environment: PaddleEnvironmentName;
  clientToken: string;
}): Promise<PaddleInstance> {
  if (!initPromise) {
    initPromise = loadPaddleJs().then((Paddle) => {
      Paddle.Initialize({
        environment: options.environment,
        token: options.clientToken,
        eventCallback: (event) => {
          // Route to the active checkout attempt only; cleared when it settles.
          activeEventHandler?.(event);
        },
      });
      return Paddle;
    });
  }
  return initPromise;
}

/**
 * Open an overlay checkout for the given price (Paddle itself is initialized
 * once per page by `ensurePaddleInitialized`).
 *
 * Resolution rules:
 * - Resolves with status "completed" when the checkout completes.
 * - Resolves with status "closed" when the user dismisses it without paying.
 * - Rejects with a safe, user-displayable CheckoutError when Paddle refuses
 *   to open the checkout (`checkout.error`), when the script/init chain
 *   fails, or when nothing happens at all within the opening timeout.
 *
 * Timeout scope: `CHECKOUT_OPEN_TIMEOUT_MS` protects only the phase where a
 * failure can be silent — the script/init wait and the failed open. The
 * first `checkout.loaded` proves the form is interactive and disarms the
 * timer; from there the session may take as long as the user needs and the
 * terminal events (completed/closed/error) settle it.
 */
export function openCheckout(options: {
  environment: PaddleEnvironmentName;
  clientToken: string;
  priceId: string;
  customerEmail?: string;
  fluxricoUserId: string;
}): Promise<CheckoutResult> {
  return new Promise<CheckoutResult>((resolve, reject) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Settle at most once; also detaches from Paddle and clears the timer.
    const finish = (settle: () => void): void => {
      if (settled) return;
      settled = true;
      activeEventHandler = null;
      disarm();
      settle();
    };

    // Safe and idempotent: extra calls and calls after settle are no-ops.
    const disarm = (): void => {
      if (timer != null) {
        clearTimeout(timer);
        timer = undefined;
      }
    };

    // Armed before the init chain so a stalled script load cannot outlive the
    // opening-phase guarantee either.
    timer = setTimeout(() => {
      finish(() => reject(new CheckoutError(TIMEOUT_MESSAGE)));
    }, CHECKOUT_OPEN_TIMEOUT_MS);

    void ensurePaddleInitialized({
      environment: options.environment,
      clientToken: options.clientToken,
    })
      .then((Paddle) => {
        if (settled) return; // The opening timeout already fired.

        activeEventHandler = (event) => {
          if (event.name === "checkout.completed") {
            finish(() => resolve({ status: "completed", transactionId: (event as PaddleCheckoutCompletedEvent).data?.id }));
          } else if (event.name === "checkout.closed") {
            finish(() => resolve({ status: "closed" }));
          } else if (event.name === "checkout.error") {
            // Paddle's failure to open the checkout: a fixed, safe message —
            // never the raw event payload.
            finish(() => reject(new CheckoutError(OPEN_ERROR_MESSAGE)));
          } else if (event.name === "checkout.loaded") {
            // The overlay is up: opening phase succeeded. Disarm the timer
            // without settling so users may take as long as they need; the
            // terminal events settle the attempt from here on.
            disarm();
          }
          // Any other Paddle events do not settle the attempt.
        };

        try {
          Paddle.Checkout.open({
            items: [{ priceId: options.priceId, quantity: 1 }],
            customer: options.customerEmail ? { email: options.customerEmail } : undefined,
            customData: { fluxricoUserId: options.fluxricoUserId },
            settings: { displayMode: "overlay" },
          });
        } catch {
          finish(() => reject(new CheckoutError(OPEN_ERROR_MESSAGE)));
        }
      })
      .catch(() => {
        // Script load or initialization failed; fixed safe message, nothing
        // raw from the loader surfaces.
        finish(() => reject(new CheckoutError(OPEN_ERROR_MESSAGE)));
      });
  });
}
