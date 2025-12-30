import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Kernl } from "kernl";

import type { Variables, HonoOptions } from "./types";
import { errorHandler } from "./lib/error";
import { logreq } from "./lib/logger";

/* routes */
import { agents } from "./api/agents/route";
import { threads } from "./api/threads/route";
import { realtime } from "./api/realtime/route";
import { health } from "./api/health/route";

/**
 * Create a Hono app wired to a Kernl instance.
 *
 * @example
 * import { hono } from "@kernl-sdk/server";
 * import { serve } from "@hono/node-server";
 *
 * const app = hono(kernl);
 * app.get("/custom", (c) => c.text("hello"));
 *
 * serve({ fetch: app.fetch, port: 3000 });
 */
export function hono(
  kernl: Kernl,
  options: HonoOptions = {},
): Hono<{ Variables: Variables }> {
  const { prefix = "", cors: origins = ["*"] } = options;

  const app = new Hono<{ Variables: Variables }>();

  // --- middleware ---
  app.use("/*", logreq);
  app.use("/*", cors({ origin: origins, credentials: true }));
  app.use("/*", async (c, next) => {
    c.set("kernl", kernl);
    await next();
  });
  app.onError(errorHandler);

  // --- routes ---
  app.route(`${prefix}/agents`, agents);
  app.route(`${prefix}/threads`, threads);
  app.route(`${prefix}/realtime`, realtime);
  app.route("/health", health);

  return app;
}
