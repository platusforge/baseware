import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env } from "@/env";
import { logger, morganMiddleware } from "@/logger";
import { routes } from "@/routes";

export function createApp() {
  const app = express();

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
    return res.status(500).json({ message: "Internal error" });
  });

  return app;
}
