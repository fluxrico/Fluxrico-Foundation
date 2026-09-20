import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

/**
 * Server-side journey state — one row per user.
 *
 * The workspace (Navigator answers, stage completions, library pieces,
 * notifications read-state, workspace settings) is user-owned product data:
 * it must survive refreshes, sign-out, and new sessions. The shape is stored
 * as JSONB under one versioned, server-validated envelope so the workspace
 * can evolve without a migration per field, while the identity, timestamps,
 * and update origin stay first-class columns.
 *
 * Clients never set `updatedAt` or `updatedFrom`: the server stamps both.
 */
export const userJourney = pgTable(
  "user_journey",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    /** Schema version of the payload envelope, for forward-safe migrations. */
    schemaVersion: text("schema_version").notNull().default("1"),

    /** The validated workspace payload (see PUT /api/journey request schema). */
    payload: jsonb("payload").notNull(),

    /** Server-stamped: last accepted write. */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("user_journey_user_id_idx").on(table.userId)],
);

export const userJourneyRelations = relations(userJourney, ({ one }) => ({
  user: one(users, {
    fields: [userJourney.userId],
    references: [users.id],
  }),
}));

export type UserJourney = typeof userJourney.$inferSelect;
export type NewUserJourney = typeof userJourney.$inferInsert;
