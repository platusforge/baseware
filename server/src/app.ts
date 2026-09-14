import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import * as Sentry from "@sentry/node";
import { env } from "@/env";
import { logger, morganMiddleware } from "@/logger";
import { routes } from "@/routes";

if (env.SENTRY_DSN) {
  Sentry.init({ dsn: env.SENTRY_DSN, tracesSampleRate: 0.1 });
} else if (env.NODE_ENV === "production") {
  logger.warn("observability: SENTRY_DSN empty in production — errors only in stdout.");
}

export function createApp() {
  const app = express();

  // Behind Traefik/nginx so express-rate-limit sees the real client IP.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: [env.FRONTEND_URL],
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(morganMiddleware);

  // Capture the raw body on every JSON request. The Stripe webhook route
  // reads req.rawBody to verify the signature — no path sniffing, no
  // double-parsing. Works with `stripe listen --forward-to`.
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as unknown as { rawBody: Buffer }).rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(routes);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error(`Unhandled error: ${err instanceof Error ? err.message : err}`);
    if (env.SENTRY_DSN) Sentry.captureException(err);
    return res.status(500).json({ message: "Internal error" });
  });

  return app;
}
