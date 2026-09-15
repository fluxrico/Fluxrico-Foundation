export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";
// Typed fetch errors (status + parsed body) so callers can branch on 401/403/409.
export { ApiError, ResponseParseError } from "./custom-fetch";
