import { defineConfig } from "drizzle-kit";
import path from "path";
import { resolvePostgresSsl } from "./src/ssl";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: resolvePostgresSsl(process.env.DATABASE_URL),
  },
});
