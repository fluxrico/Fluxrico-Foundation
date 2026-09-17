import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { index, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./auth";

/**
 * Subscription access foundation (Phase 1: Pro) + billing provider link
 * (Phase 2: Paddle).
 *
 * One row per user — trial and paid-state in a single place, never scattered
 * across unrelated tables. The backend derives access from this row and the
 * current time; the client can never grant itself Pro.
 *
 * Trial semantics:
 * - 3-day trial starts at registration (written server-side at insert time).
 * - Existing users created before this feature are lazily backfilled with a
 *   trial starting at first resolution — no account is invalidated and no
 *   journey data is touched.
 * - Expiry deletes nothing: journey, profile, and settings survive. Only
 *   Pro-only capabilities are blocked.
 *
 * Paid state (status, billing interval, current-period timestamps,
 * cancellation) is written by the billing layer only, driven by verified
 * provider webhooks (Paddle). It is provider-generic: the billing* columns
 * hold Paddle identifiers today and would hold any provider's identifiers in
 * the same shape tomorrow. A null/`none` paid state simply means "no
 * subscription recorded yet".
 */
export const userSubscriptions = pgTable("user_subscriptions", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),

  // ── Trial ──────────────────────────────────────────────────────────────────
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }).notNull(),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }).notNull(),

  // ── Paid state (billing-layer owned; `none` until a subscription exists) ──
  /** none | active | canceled — mirrors a billing provider's lifecycle. */
  status: text("status").notNull().default("none"),
  /** monthly | yearly — null until a real subscription exists. */
  billingInterval: text("billing_interval"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  /** Standard cancel-at-period-end: access continues until the period ends. */
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),

  // ── Provider identifiers (nullable until a real purchase links one) ───────
  /** Billing provider customer id (Paddle: ctm_…). */
  billingCustomerId: text("billing_customer_id"),
  /** Billing provider subscription id (Paddle: sub_…). */
  billingSubscriptionId: text("billing_subscription_id"),
  /** Billing provider price id backing the current plan (Paddle: pri_…). */
  billingPriceId: text("billing_price_id"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Webhook idempotency ledger — one row per delivered provider event.
 *
 * The unique (provider, event_id) pair is the gate: the first delivery of an
 * event inserts the row and is processed; every redelivery conflicts and is
 * acknowledged without reprocessing. Processing failures delete their gate
 * row so the provider's retry finds it unprocessed.
 */
export const billingWebhookEvents = pgTable(
  "billing_webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Billing provider that delivered the event (e.g. "paddle"). */
    provider: text("provider").notNull().default("paddle"),
    /** The provider's event id (Paddle: evt_…) — unique per provider. */
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("billing_webhook_events_provider_event_id_idx").on(table.provider, table.eventId),
    index("billing_webhook_events_received_at_idx").on(table.receivedAt),
  ],
);

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [userSubscriptions.userId],
    references: [users.id],
  }),
}));

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
export type BillingWebhookEvent = typeof billingWebhookEvents.$inferSelect;
