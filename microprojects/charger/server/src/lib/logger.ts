import pino from "pino";
import type { Context, Next } from "hono";

import { env } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV !== "production"
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

export async function logreq(cx: Context, next: Next) {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  logger.info(
    {
      status: cx.res.status,
      duration_ms: duration,
    },
    `${cx.req.method} ${cx.req.path}`,
  );
}
