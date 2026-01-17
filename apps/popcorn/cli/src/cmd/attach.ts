/**
 * Attach command: popcorn attach <url>
 *
 * Connects the TUI to an existing server.
 * No worker is spawned - uses standard fetch to communicate with the server.
 */
import { Command } from "commander";

interface AttachOptions {
  dir?: string;
  session?: string;
}

export const attach = new Command("attach")
  .description("Attach to a running server")
  .argument("<url>", "Server URL (e.g., http://localhost:3100)")
  .option("--dir <dir>", "Directory to run in")
  .option("-s, --session <id>", "Session ID to continue")
  .action(async (url: string, options: AttachOptions) => {
    if (options.dir) {
      process.chdir(options.dir);
    }

    // TODO: Import and start TUI with standard fetch (no customFetch needed)
    // await tui({ url, args: { sessionID: options.session } })

    console.log(`[popcorn] Attaching to ${url}`);
    console.log(`[popcorn] Directory: ${process.cwd()}`);
    console.log(`[popcorn] Press Ctrl+C to exit`);

    // Keep alive for now
    await new Promise<void>((resolve) => {
      process.on("SIGINT", () => {
        console.log("\n[popcorn] Detaching...");
        resolve();
      });
    });
  });
