import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
// "./schema/index.js" (not "./schema"): executes as native ESM in production
// (Vercel's TS runtime), where directory imports are unsupported
// (ERR_UNSUPPORTED_DIR_IMPORT); see artifacts/api-server/src/app.ts.
import * as schema from "./schema/index.js";
import { resolvePostgresSsl } from "./ssl";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: resolvePostgresSsl(process.env.DATABASE_URL),
});
export const db = drizzle(pool, { schema });

export * from "./schema/index.js";
