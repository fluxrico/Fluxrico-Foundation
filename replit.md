# Fluxrico

Fluxrico is a premium foundation experience for turning an unfinished idea into a clearer path toward digital income.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/fluxrico run dev` — run the Fluxrico web app (workflow supplies `PORT` and `BASE_PATH`)

## Environment variables (server-side secrets — never expose to the browser)

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string. Supabase → Project Settings → Database → Connection string (pooled URI recommended). |
| `RESEND_API_KEY` | For email | Resend API key (starts with `re_`). Without it, outbound email is honestly skipped as `not-configured`. |
| `EMAIL_FROM` | For email | Sender, e.g. `Fluxrico <no-reply@fluxrico.app>` — must be a verified sender/domain in Resend. Until a Fluxrico domain is verified, the sandbox uses Resend's testing sender `onboarding@resend.dev`; delivery is simulated for `delivered@resend.dev`-style test addresses. Switching to production is only a value change. |
| `APP_BASE_URL` | Optional | Absolute origin used for verification/reset links when the request host is not the public origin. |
| `RESEND_BASE_URL` | Optional | Override the Resend API base URL (rarely needed). |
| `PADDLE_API_KEY` | For checkout | Server-only Paddle Billing API key (starts with `pdl_`). Never exposed to the browser; enables price discovery, webhook verification reads, and portal sessions. |
| `PADDLE_CLIENT_TOKEN` | For checkout | Public Paddle client token (starts with `ctk_`) served to the browser via `GET /api/billing/config` for Paddle.js overlay checkout. |
| `PADDLE_WEBHOOK_SECRET` | For webhooks | Paddle notification webhook secret. Required for `POST /api/billing/webhook` to accept any event; requests without a valid signature are rejected. |
| `PADDLE_PRICE_ID_MONTHLY` / `PADDLE_PRICE_ID_YEARLY` | Optional | Explicit Fluxrico Pro price IDs (`pri_…`). When unset, the server discovers them from the live Paddle catalog by exact match (EUR 9.99/month, EUR 79.99/year) and never guesses. |
| `PADDLE_ENV` | Optional | `sandbox` (default) or `live` — selects the Paddle API base URL. |
| `PADDLE_API_BASE_URL` | Optional | Override the Paddle API base URL (used by the integration test harness). |

Until `RESEND_API_KEY` + `EMAIL_FROM` are set, registration/reset succeed but deliver no email (API responses report `emailDelivered: false`). See `artifacts/api-server/src/lib/email.ts` for the boundary contract.

Until the Paddle variables are set, `/pro` renders honestly with checkout disabled (the API reports the exact missing piece), and webhooks are rejected without a valid signature. The webhook URL to configure in Paddle is `POST /api/billing/webhook`; see `artifacts/api-server/src/lib/paddle.ts` and `artifacts/api-server/src/lib/billing.ts`.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/fluxrico/src/App.tsx` — routing shell: landing page at `/` plus all workspace routes
- `artifacts/fluxrico/src/pages/landing.tsx` — marketing landing page (hero, problem, journey, Navigator preview, roadmap, dashboard preview, philosophy, final CTA, footer)
- `artifacts/fluxrico/src/components/landing/*` — landing-scoped components: theme (light/dark/system, scoped to the landing root), header, hero, sections, and preview chrome
- `artifacts/fluxrico/src/index.css` — Fluxrico theme tokens, typography, and responsive visual system
- `artifacts/fluxrico/src/components/fluxrico-mark.tsx` — replaceable Fluxrico brand mark component
- `artifacts/fluxrico/src/components/fluxrico-signal.tsx` — reusable visual signal component for the foundation screen
- `artifacts/fluxrico/src/pages/dashboard.tsx` — frontend-only dashboard state and composition
- `artifacts/fluxrico/src/components/dashboard-*.tsx` — modular dashboard shell and dashboard cards
- `artifacts/fluxrico/src/components/new-user-dashboard.tsx` — new-user dashboard preview state
- `lib/api-spec/openapi.yaml` — shared API contract (unchanged; no Fluxrico product API yet)

## Architecture decisions

- The first release is frontend-only and intentionally has no database, authentication, payment, AI, external integration, or product workflow logic.
- The Fluxrico web app is a separate root-mounted React + Vite artifact in the existing pnpm workspace.
- The visual system is defined in the app theme CSS, while brand marks live in focused components so the final SVG asset can replace them later.
- The foundation remains at `/`; the dashboard is a separate `/dashboard` route so the original brand screen stays intact.
- Dashboard content uses local placeholder state only. The sidebar preview control switches between the in-progress and new-user states without implying persistence.

## Product

The current product surface includes the marketing landing page at `/` and the frontend-only dashboard at `/dashboard`. The dashboard establishes the home-base experience with current stage, next move, roadmap progress, goal snapshot, recent activity, and a new-user state. Navigator, Roadmap, Library, and all backend-powered features remain intentionally deferred.

## User preferences

The supplied product brief prioritizes a premium, calm, minimal, professional experience that avoids generic AI dashboards, excessive gradients, and unnecessary motion.

## Gotchas

The Fluxrico artifact workflow provides the required `PORT` and `BASE_PATH`; use the managed workflow rather than starting Vite directly without those variables.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
