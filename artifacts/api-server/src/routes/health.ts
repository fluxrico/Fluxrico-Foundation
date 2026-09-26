import { Router, type IRouter } from "express";
// Extensionless relative specifiers: see lib/billing.ts for the rationale
// (bare @workspace/* exports point at .ts sources, unresolvable in the
// Vercel classic Node runtime).
import { HealthCheckResponse } from "../../../../lib/api-zod/src/index";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
