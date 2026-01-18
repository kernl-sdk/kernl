import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { Kernl } from "kernl";
import { postgres } from "@kernl-sdk/pg";

import { APIError } from "@/lib/error";
import { logger, logreq } from "@/lib/logger";
import { env } from "@/lib/env";

import { charger } from "@/agents/charger";

import agents from "@/api/agents";
import threads from "@/api/threads";

type Variables = {
  kernl: Kernl;
};

export function build(): Hono<{ Variables: Variables }> {
  const kernl = new Kernl({
    storage: { db: postgres({ connstr: env.DATABASE_URL }) },
  });

  kernl.register(charger);

  const app = new Hono<{ Variables: Variables }>();

  app.use("/*", logreq);

  app.use(
    "/*",
    cors({
      origin: [env.WEB_ORIGIN],
      credentials: true,
    }),
  );

  app.use("/*", async (cx, next) => {
    cx.set("kernl", kernl);
    await next();
  });

  app.onError(handleError);

  app.route("/agents", agents);
  app.route("/threads", threads);
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
