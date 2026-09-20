import express, { type Request } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app = express();

// Behind the deployment proxy, req.protocol must reflect the real client
// scheme so session cookies get the Secure flag in production HTTPS.
app.set("trust proxy", 1);

// ── CORS ─────────────────────────────────────────────────────────────────────
// The web app calls this API same-origin, so browsers only need CORS for
// explicit cross-origin development setups. Production is locked to the
// configured origin(s); when none is configured, cross-origin browser calls
// are simply not allowed (same-origin traffic needs no CORS at all). The
// webhook endpoint is a server-to-server call — Paddle's client sends no
// Origin header and never reads responses, so CORS does not apply to it.
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

app.use((req, res, next) => {
  const origin = req.header("origin");

  // No Origin header: same-origin or non-browser client — nothing to gate.
  if (!origin) {
    next();
    return;
  }

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "600");
    next();
    return;
  }

  // Unknown origin: never reflect it. The request proceeds without CORS
  // headers, so browsers block reading the response while non-browser
  // callers (webhooks) are unaffected.
  next();
});

// Pre-flight: answer directly once the origin check above has run.
// (Express 5's router rejects the old bare-"*" route pattern, so OPTIONS is
// handled with a method check instead — identical semantics, any path.)
app.use((req, res, next) => {
  if (req.method !== "OPTIONS") {
    next();
    return;
  }
  res.sendStatus(req.header("origin") && allowedOrigins.includes(req.header("origin") ?? "") ? 204 : 403);
});

// ── Security headers ─────────────────────────────────────────────────────────
// Applied to every API response. The SPA is served separately as static
// files; these headers protect the API surface without breaking cookies,
// cross-origin JSON, or Paddle's server-to-server webhook posts.
app.use((_req, res, next) => {
  // The API never renders content in a browsing context.
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  // Force HTTPS transport in production; harmless in development.
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  // Correct the browser about the request scheme when behind a proxy so
  // redirects and cookies derived from req.protocol stay right.
  res.setHeader("X-Robots-Tag", "noindex");
  next();
});

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cookieParser());

// Capture the exact bytes Paddle signs BEFORE body parsing mutates them —
// webhook signature verification requires the raw payload. Everything else
// is parsed normally.
app.use(
  express.json({
    verify: (req: Request, _res, buf) => {
      if (req.originalUrl.includes("/api/billing/webhook")) {
        (req as Request & { rawBody?: string }).rawBody = buf.toString("utf8");
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
