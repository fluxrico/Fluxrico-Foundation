# Fluxrico

Fluxrico is a premium foundation experience for turning an unfinished idea into a clearer path toward digital income.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- `pnpm --filter @workspace/fluxrico run dev` — run the Fluxrico web app (workflow supplies `PORT` and `BASE_PATH`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/fluxrico/src/App.tsx` — foundation screen and responsive application shell
- `artifacts/fluxrico/src/index.css` — Fluxrico theme tokens, typography, and responsive visual system
- `artifacts/fluxrico/src/components/fluxrico-mark.tsx` — replaceable Fluxrico brand mark component
- `artifacts/fluxrico/src/components/fluxrico-signal.tsx` — reusable visual signal component for the foundation screen
- `lib/api-spec/openapi.yaml` — shared API contract (unchanged; no Fluxrico product API yet)

## Architecture decisions

- The first release is presentation-first and intentionally has no database, authentication, payment, AI, or product workflow logic.
- The Fluxrico web app is a separate root-mounted React + Vite artifact in the existing pnpm workspace.
- The visual system is defined in the app theme CSS, while brand marks live in focused components so the final SVG asset can replace them later.
- Navigation labels and calls to action are foundation placeholders; they do not imply implemented product routes.

## Product

The current product surface is a responsive foundation screen that establishes the Fluxrico brand, typography, color system, application shell, and reusable visual language. Dashboard, Navigator, Roadmap, Library, and all backend-powered features are intentionally deferred.

## User preferences

The supplied product brief prioritizes a premium, calm, minimal, professional experience that avoids generic AI dashboards, excessive gradients, and unnecessary motion.

## Gotchas

The Fluxrico artifact workflow provides the required `PORT` and `BASE_PATH`; use the managed workflow rather than starting Vite directly without those variables.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
