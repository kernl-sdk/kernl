import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { Kernl } from "kernl";
import { postgres } from "@kernl-sdk/pg";

import { APIError } from "@/lib/error";
import { logger, logreq } from "@/lib/logger";
import { env } from "@/lib/env";

/* agents */
import { jarvis } from "@/agents/jarvis";
import { titler } from "@/agents/title-agent";

/* routes */
import agents from "@/_api/v1/agents/route";
import threads from "@/_api/v1/threads/route";

type Variables = {
  kernl: Kernl;
};

/**
 * Hono builder - registers routes, error handler, plugins, etc.
 */
export function build(): Hono<{ Variables: Variables }> {
  const kernl = new Kernl({
    storage: { db: postgres({ connstr: env.DATABASE_URL }) },
  });
  kernl.register(jarvis);
  kernl.register(titler);

  const app = new Hono<{ Variables: Variables }>();

  app.use("/*", logreq);

  // --- CORS ---
  app.use(
    "/*",
    cors({
      origin: [env.NEXTJS_DOMAIN],
      credentials: true,
    }),
  );

  // --- inject kernl into context ---
  app.use("/*", async (cx, next) => {
    cx.set("kernl", kernl);
    await next();
  });

  app.onError(handleError);

  // --- ROUTES ---
  app.route("/v1/agents", agents);
  app.route("/v1/threads", threads);
  app.get("/health", (cx) => {
    return cx.json({ status: "ok" });
  });

  return app;
}

/**
 * Convert errors to a standard structured response
 */
function handleError(
  err: Error,
  cx: Context<{ Variables: Variables }>,
): Response {
  if (err instanceof APIError) {
    logger.error({ error: err, metadata: err.metadata }, err.message);
    return cx.json(err.json(), err.statusCode);
  }

  // unknown errors - log with more details
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
