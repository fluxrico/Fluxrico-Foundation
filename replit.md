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

- `artifacts/fluxrico/src/App.tsx` — foundation screen, dashboard route, and responsive routing shell
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

The current product surface includes the responsive foundation screen at `/` and the frontend-only dashboard at `/dashboard`. The dashboard establishes the home-base experience with current stage, next move, roadmap progress, goal snapshot, recent activity, and a new-user state. Navigator, Roadmap, Library, and all backend-powered features remain intentionally deferred.

## User preferences

The supplied product brief prioritizes a premium, calm, minimal, professional experience that avoids generic AI dashboards, excessive gradients, and unnecessary motion.

## Gotchas

The Fluxrico artifact workflow provides the required `PORT` and `BASE_PATH`; use the managed workflow rather than starting Vite directly without those variables.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
