/**
 * Paddle.js client integration — official CDN loader with a minimal typed
 * surface. Loaded lazily, once, on first checkout; the client token comes
 * from GET /api/billing/config (never bundled). The API key stays server-side.
 *
 * No npm dependency: Paddle documents the CDN include for Paddle.js v2, and
 * this keeps the bundle free of a vendor script that only one page needs.
 */

type PaddleEnvironmentName = "sandbox" | "live";

type CheckoutResult =
  | { status: "completed"; transactionId?: string }
  | { status: "closed" };

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

type PaddleEvent = PaddleCheckoutCompletedEvent | PaddleCheckoutClosedEvent;

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

/**
 * Initialize Paddle for this page load and open an overlay checkout for the
 * given price. Resolves only when the checkout actually completes; resolves
 * with status "closed" when the user dismisses it without paying.
 */
export async function openCheckout(options: {
  environment: PaddleEnvironmentName;
  clientToken: string;
  priceId: string;
  customerEmail?: string;
  fluxricoUserId: string;
}): Promise<CheckoutResult> {
  const Paddle = await loadPaddleJs();

  return new Promise<CheckoutResult>((resolve, reject) => {
    let settled = false;

    try {
      Paddle.Initialize({
        environment: options.environment,
        token: options.clientToken,
        eventCallback: (event) => {
          if (settled) return;
          if (event.name === "checkout.completed") {
            settled = true;
            resolve({ status: "completed", transactionId: event.data?.id });
          } else if (event.name === "checkout.closed") {
            // The overlay went away; whether it completed is decided above.
            settled = true;
            resolve({ status: "closed" });
          }
        },
      });
      Paddle.Checkout.open({
        items: [{ priceId: options.priceId, quantity: 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: { fluxricoUserId: options.fluxricoUserId },
        settings: { displayMode: "overlay" },
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Checkout could not be opened."));
    }
  });
}
