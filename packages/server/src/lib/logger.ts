import pino from "pino";
import type { Context, Next } from "hono";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

/**
 * Hono middleware for logging HTTP requests
 */
export async function logreq(cx: Context, next: Next) {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  logger.info(
    {
      status: cx.res.status,
      duration_ms: duration,
    },
    `${cx.req.method} ${cx.req.path}`
  );
}
