import express, { type Express, type Request } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Behind the deployment proxy, req.protocol must reflect the real client
// scheme so session cookies get the Secure flag in production HTTPS.
app.set("trust proxy", 1);

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
// Cross-origin API callers must send and receive the session cookie.
app.use(cors({ credentials: true }));
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
