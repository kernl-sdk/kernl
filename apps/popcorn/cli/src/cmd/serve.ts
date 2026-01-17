/**
 * Serve command: popcorn serve
 *
 * Starts the server in headless mode (HTTP server, no TUI).
 * Useful for running the server separately from the TUI.
 */
import { Command } from "commander";
import { serve as honoServe } from "@hono/node-server";
import { build } from "server0/app";

interface ServeOptions {
  port: number;
  hostname: string;
}

export const serve = new Command("serve")
  .description("Start the headless HTTP server")
  .option("-p, --port <port>", "Port to listen on", "3100")
  .option("-h, --hostname <hostname>", "Hostname to bind to", "127.0.0.1")
  .action(async (options: ServeOptions) => {
    const app = build();
    const port =
      typeof options.port === "string"
        ? parseInt(options.port, 10)
        : options.port;
    const hostname = options.hostname;

    honoServe({ fetch: app.fetch, port, hostname }, (info) => {
      console.log(
        `[popcorn] Server running on http://${info.address}:${info.port}`,
      );
      console.log(`[popcorn] Press Ctrl+C to stop`);
    });
  });
