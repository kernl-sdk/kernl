import { serve } from "@hono/node-server";
import { getWorld } from "workflow/runtime";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

import { build } from "./app";

async function main() {
  logger.info("Starting PostgreSQL World...");
  await getWorld().start?.(); // start postgres World for workflow execution

  const app = build();
  const port = parseInt(env.PORT);

  logger.info(`Watson server running at http://localhost:${port}`);

  serve({
    fetch: app.fetch,
    port,
    hostname: env.HOST,
  });
}

main().catch((err) => {
  logger.fatal(err);
  process.exit(1);
});
