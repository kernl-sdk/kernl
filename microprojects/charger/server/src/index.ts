import { serve } from "@hono/node-server";

import { env } from "@/lib/env";
import { logger } from "@/lib/logger";

import { build } from "./app";

async function main() {
  const app = build();

  const port = parseInt(env.PORT);

  logger.info(`Server running at http://localhost:${port}`);

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
