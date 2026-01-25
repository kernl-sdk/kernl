import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { Kernl } from "kernl";
import { postgres } from "@kernl-sdk/pg";
import { turbopuffer } from "@kernl-sdk/turbopuffer";

import { APIError } from "@/lib/error";
import { logger, logreq } from "@/lib/logger";
import { env } from "@/lib/env";

import { watson } from "@/agents/watson";

import fireflies from "@/api/webhooks/fireflies";

type Variables = {
  kernl: Kernl;
};

/**
 * Hono builder - registers routes, error handler, plugins, etc.
 */
export function build(): Hono<{ Variables: Variables }> {
  const kernl = new Kernl({
    storage: {
      db: postgres({ url: env.DATABASE_URL }),
      vector: turbopuffer({
        apiKey: env.TURBOPUFFER_API_KEY,
        region: "api",
      }),
    },
  });

  kernl.register(watson);

  const app = new Hono<{ Variables: Variables }>();

  app.use("/*", logreq);

  app.use(
    "/*",
    cors({
      origin: [env.WEB_DOMAIN],
      credentials: true,
    }),
  );

  app.use("/*", async (cx, next) => {
    cx.set("kernl", kernl);
    await next();
  });

  app.onError(handleError);

  // --- ROUTES ---
  app.route("/webhooks/fireflies", fireflies);
  app.get("/health", (cx) => cx.json({ status: "ok" }));

  return app;
}

function handleError(
  err: Error,
  cx: Context<{ Variables: Variables }>,
): Response {
  if (err instanceof APIError) {
    logger.error({ error: err, metadata: err.metadata }, err.message);
    return cx.json(err.json(), err.statusCode);
  }

  logger.error({ err }, "unknown:error");
  return cx.json(
    {
      error: {
        code: "internal_server_error",
        message: "An unexpected error occurred",
      },
    },
    500,
  );
}
