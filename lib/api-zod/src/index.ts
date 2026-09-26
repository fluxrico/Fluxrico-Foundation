export * from "./generated/api";
// "./generated/types/index.js" (not "./generated/types"): executes as native
// ESM in production (Vercel's TS runtime), where directory imports are
// unsupported (ERR_UNSUPPORTED_DIR_IMPORT); see artifacts/api-server/src/app.ts.
export * from "./generated/types/index.js";
