import { serve as honoServe } from "@hono/node-server";
import type { Kernl } from "kernl";

import { hono } from "./app";
import { logger } from "./lib/logger";
import type { ServeOptions } from "./types";

/**
 * One-liner dev server.
 *
 * @example
 * import { serve } from "@kernl-sdk/server";
 *
 * serve(kernl, { port: 3000 });
 */
export function serve(kernl: Kernl, options: ServeOptions = {}): void {
  const { port = 3000, hostname = "0.0.0.0", ...honoOptions } = options;

  const app = hono(kernl, honoOptions);

  logger.info(`listening on ${hostname}:${port}`);

  honoServe({
    fetch: app.fetch,
    port,
    hostname,
  });
}
