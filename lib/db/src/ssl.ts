// TLS policy for Postgres connections, derived from the connection string's
// `sslmode` parameter using standard Postgres semantics.
//
// Default when no sslmode is present: "require" — always encrypt, skip CA
// verification. This is required for hosted providers such as Supabase,
// whose poolers present a certificate signed by their own CA (not in Node's
// default trust store) — encryption without CA checking is the documented
// posture for `sslmode=require`. Use `?sslmode=disable` in the DATABASE_URL
// to opt out for local development.
export function resolvePostgresSsl(
  connectionString: string,
): { rejectUnauthorized: boolean } | undefined {
  let sslmode: string | null;
  try {
    sslmode = new URL(connectionString).searchParams.get("sslmode");
  } catch {
    sslmode = null;
  }
  switch (sslmode) {
    case "disable":
      return undefined;
    case "verify-ca":
    case "verify-full":
      // Full chain verification (pair with NODE_EXTRA_CA_CERTS pointing at
      // the provider's root CA when its certificate is not publicly trusted).
      return { rejectUnauthorized: true };
    default:
      // require / prefer / allow / absent → encrypt, no CA verification.
      return { rejectUnauthorized: false };
  }
}
