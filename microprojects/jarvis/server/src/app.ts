import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { Kernl } from "@kernl-sdk/core";

import { APIError } from "@/lib/error";
import { logger, logreq } from "@/lib/logger";

import { jarvis } from "@/agents/jarvis";

/* routes */
import agents from "@/_api/v1/agents/route";
import threads from "@/_api/v1/threads/route";

/**
 * Hono builder - registers routes, error handler, plugins, etc.
 */
export function build(): Hono {
  const kernl = new Kernl();
  kernl.register(jarvis);

  const app = new Hono();

  // --- logging ---
  app.use("/*", logreq);

  // --- CORS ---
  app.use(
    "/*",
    cors({
      origin: ["http://localhost:3000"], // env.CLIENT_DOMAIN
      credentials: true,
    }),
  );

  app.onError(handleError);

  // --- routes ---
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
function handleError(err: Error, cx: Context) {
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
