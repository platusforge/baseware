import winston from "winston";
import morgan from "morgan";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
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

export const morganMiddleware = morgan(
  (tokens, req, res) => {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
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
