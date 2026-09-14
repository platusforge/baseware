import winston from "winston";
import morgan from "morgan";
import { env } from "@/env";

export const logger = winston.createLogger({
  level: env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...rest }) => {
      return `${timestamp} [${level.toUpperCase()}] ${message} ${
        Object.keys(rest).length ? JSON.stringify(rest) : ""
      }`.trimEnd();
    }),
  ),
  transports: [new winston.transports.Console()],
});

const SENSITIVE_QUERY = new Set(["code", "state", "token", "access_token", "refresh_token"]);

/** Redact OAuth codes, states and tokens from logged URLs. */
function safeUrl(raw: string): string {
  const qIndex = raw.indexOf("?");
  if (qIndex === -1) return raw;
  const params = new URLSearchParams(raw.slice(qIndex + 1));
  let redacted = false;
  for (const key of SENSITIVE_QUERY) {
    if (params.has(key)) {
      params.set(key, "[redacted]");
      redacted = true;
    }
  }
  return redacted ? `${raw.slice(0, qIndex)}?${params.toString()}` : raw;
}

export const morganMiddleware = morgan(
  (tokens, req, res) => {
    return [
      tokens.method(req, res),
      safeUrl(tokens.url(req, res) ?? ""),
      tokens.status(req, res),
      tokens["response-time"](req, res) + " ms",
      "-",
      tokens.res(req, res, "content-length") ?? "0",
      "bytes",
    ].join(" ");
  },
  {
    stream: { write: (message: string) => logger.info(message.trim()) },
  },
);
