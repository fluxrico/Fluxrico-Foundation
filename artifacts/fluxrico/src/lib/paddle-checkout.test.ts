import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CheckoutResult } from './paddle-checkout';

/**
 * Tests for the Paddle checkout lifecycle guarantees fixed after diagnosis:
 *
 * - checkout.error must reject the promise with a safe, user-displayable
 *   message (previously the event was ignored and the caller hung forever).
 * - a checkout attempt that never settles must reject via the 15s timeout.
 * - once checkout.loaded confirms the form opened, the timeout is disarmed:
 *   a checkout session slower than 15s must still settle normally — the
 *   timeout exists to catch silent opening failures, not slow payers.
 * - a settled attempt must never settle twice (late events are ignored) and
 *   its timeout must be cleared.
 * - Paddle.Initialize runs exactly once per page, no matter how many checkout
 *   attempts happen; later attempts still get fresh event routing.
 *
 * Environment: vitest runs in Node here, so the CDN/document path is bypassed
 * by injecting a fake `window.Paddle` — matching the loader's own
 * `if (window.Paddle)` browser branch. Module state (initialize-once, event
 * routing) resets per test via vi.resetModules() + a dynamic import.
 */

type PaddleEventLike = { name: string; data?: unknown };

type CheckoutModule = {
  openCheckout: (options: {
    environment: 'sandbox' | 'live';
    clientToken: string;
    priceId: string;
    customerEmail?: string;
    fluxricoUserId: string;
  }) => Promise<CheckoutResult>;
  CheckoutError: new (message: string) => Error;
};

function makeGlobals(): {
  setFakePaddle: (paddle: unknown) => void;
  clearFakeWindow: () => void;
} {
  const holder = globalThis as unknown as { window?: unknown };
  return {
    setFakePaddle: (paddle: unknown) => {
      holder.window = { Paddle: paddle, document: undefined };
    },
    clearFakeWindow: () => {
      delete holder.window;
    },
  };
}

function makeFakePaddle() {
  let listener: ((event: PaddleEventLike) => void) | null = null;
  const initialize = vi.fn((options: { eventCallback?: (event: PaddleEventLike) => void }) => {
    listener = options.eventCallback ?? null;
  });
  const open = vi.fn();
  return {
    // Paddle-shaped instance handed to `window.Paddle`.
    paddle: { Initialize: initialize, Checkout: { open } } as unknown,
    initialize,
    open,
    emit: (event: PaddleEventLike) => {
      listener?.(event);
    },
  };
}

/** Flush the module's internal then-chain (script load + initialize) so the active checkout attempt has registered. */
async function flushAttempts(): Promise<void> {
  for (let i = 0; i < 8; i += 1) {
    await Promise.resolve();
  }
}

const OPEN_OPTIONS = {
  environment: 'sandbox' as const,
  clientToken: 'ctk_test_fixture_token',
  priceId: 'pri_test_yearly',
  customerEmail: 'buyer@example.com',
  fluxricoUserId: 'user-1',
};

describe('paddle-checkout', () => {
  const { setFakePaddle, clearFakeWindow } = makeGlobals();

  beforeEach(() => {
    setFakePaddle(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    clearFakeWindow();
  });

  async function loadModule(): Promise<CheckoutModule> {
    vi.resetModules();
    return (await import('./paddle-checkout')) as unknown as CheckoutModule;
  }

  it('resolves completed when Paddle reports checkout.completed', async () => {
    const fake = makeFakePaddle();
    setFakePaddle(fake.paddle);
    const { openCheckout } = await loadModule();

    const promise = openCheckout(OPEN_OPTIONS);
    await flushAttempts();

    fake.emit({ name: 'checkout.completed', data: { id: 'txn_1' } });
    await expect(promise).resolves.toEqual({ status: 'completed', transactionId: 'txn_1' });

    expect(fake.open).toHaveBeenCalledTimes(1);
    expect(fake.open).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [{ priceId: 'pri_test_yearly', quantity: 1 }],
        customer: { email: 'buyer@example.com' },
        customData: { fluxricoUserId: 'user-1' },
        settings: { displayMode: 'overlay' },
      }),
    );
  });

  it('resolves closed when the user dismisses the checkout without paying', async () => {
    const fake = makeFakePaddle();
    setFakePaddle(fake.paddle);
    const { openCheckout } = await loadModule();

    const promise = openCheckout(OPEN_OPTIONS);
    await flushAttempts();

    fake.emit({ name: 'checkout.closed' });
    await expect(promise).resolves.toEqual({ status: 'closed' });
  });

  it('rejects with a safe, user-displayable message on checkout.error (raw payload never surfaced)', async () => {
    const fake = makeFakePaddle();
    setFakePaddle(fake.paddle);
    const { openCheckout, CheckoutError } = await loadModule();

    const promise = openCheckout(OPEN_OPTIONS);
    await flushAttempts();

    // Paddle's raw failure payload must never appear in the UI or logs.
    fake.emit({ name: 'checkout.error', data: { code: 'raw_paddle_internals', message: 'ctk_live_secretish' } });

    await expect(promise).rejects.toBeInstanceOf(CheckoutError);
    await expect(promise).rejects.toThrow('Checkout could not be opened. Please try again in a moment.');
    await expect(promise).rejects.not.toThrow(/raw_paddle_internals|secretish/);
  });

  it('rejects via the 15-second timeout when no event ever arrives', async () => {
    vi.useFakeTimers();
    const fake = makeFakePaddle();
    setFakePaddle(fake.paddle);
    const { openCheckout, CheckoutError } = await loadModule();

    const promise = openCheckout(OPEN_OPTIONS);
    // Attach rejection expectations before the timeout can fire so the
    // rejection is handled as soon as it happens (no async-handled warning).
    const errorExpectation = expect(promise).rejects.toBeInstanceOf(CheckoutError);
    await flushAttempts();

    await vi.advanceTimersByTimeAsync(15_000);
    await errorExpectation;
    await expect(promise).rejects.toThrow(
      'The checkout took too long to open. Please check your connection and try again.',
    );
  });

  it('disarms the opening timeout after checkout.loaded; a slow session still completes', async () => {
    vi.useFakeTimers();
    const fake = makeFakePaddle();
    setFakePaddle(fake.paddle);
    const { openCheckout } = await loadModule();

    const promise = openCheckout(OPEN_OPTIONS);

    // Observe the promise's settlement without assuming which side fires.
    let outcome: 'pending' | 'settled' = 'pending';
    void promise.then(
      () => {
        outcome = 'settled';
      },
      () => {
        outcome = 'settled';
      },
    );

    await flushAttempts();

    // The form opened. Even twice: the disarm must be idempotent.
    fake.emit({ name: 'checkout.loaded' });
    fake.emit({ name: 'checkout.loaded' });

    // Well past the 15-second opening window: the attempt must still be
    // pending — neither rejected nor resolved by the timeout.
    await vi.advanceTimersByTimeAsync(20_000);
    expect(outcome).toBe('pending');

    fake.emit({ name: 'checkout.completed', data: { id: 'txn_slow' } });
    await expect(promise).resolves.toEqual({ status: 'completed', transactionId: 'txn_slow' });
    expect(outcome).toBe('settled');
  });

  it('clears the attempt timeout once the checkout settles', async () => {
    vi.useFakeTimers();
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const fake = makeFakePaddle();
    setFakePaddle(fake.paddle);
    const { openCheckout } = await loadModule();

    const promise = openCheckout(OPEN_OPTIONS);
    await flushAttempts();

    fake.emit({ name: 'checkout.closed' });
    await expect(promise).resolves.toEqual({ status: 'closed' });
    expect(clearSpy).toHaveBeenCalledTimes(1);

    // The cleared timer must not reject afterwards (no unhandled rejection).
    await vi.advanceTimersByTimeAsync(20_000);
    await expect(promise).resolves.toEqual({ status: 'closed' });
  });

  it('initializes Paddle exactly once across repeated attempts', async () => {
    const fake = makeFakePaddle();
    setFakePaddle(fake.paddle);
    const { openCheckout } = await loadModule();

    const first = openCheckout(OPEN_OPTIONS);
    await flushAttempts();
    fake.emit({ name: 'checkout.closed' });
    await expect(first).resolves.toEqual({ status: 'closed' });

    const second = openCheckout(OPEN_OPTIONS);
    await flushAttempts();
    fake.emit({ name: 'checkout.closed' });
    await expect(second).resolves.toEqual({ status: 'closed' });

    expect(fake.initialize).toHaveBeenCalledTimes(1);
    expect(fake.open).toHaveBeenCalledTimes(2);
    expect(fake.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ environment: 'sandbox', token: 'ctk_test_fixture_token' }),
    );
  });

  it('routes late events to the newest attempt and never settles a settled attempt', async () => {
    const fake = makeFakePaddle();
    setFakePaddle(fake.paddle);
    const { openCheckout, CheckoutError } = await loadModule();

    const first = openCheckout(OPEN_OPTIONS);
    await flushAttempts();
    fake.emit({ name: 'checkout.completed', data: { id: 'txn_first' } });
    await expect(first).resolves.toEqual({ status: 'completed', transactionId: 'txn_first' });

    // Late events after settlement must not disturb it (no unhandled rejection).
    fake.emit({ name: 'checkout.error', data: { code: 'stale' } });
    fake.emit({ name: 'checkout.closed' });
    await expect(first).resolves.toEqual({ status: 'completed', transactionId: 'txn_first' });

    const second = openCheckout(OPEN_OPTIONS);
    await flushAttempts();
    fake.emit({ name: 'checkout.error', data: { code: 'stale2' } });
    await expect(second).rejects.toBeInstanceOf(CheckoutError);
    await expect(first).resolves.toEqual({ status: 'completed', transactionId: 'txn_first' });
  });
});
