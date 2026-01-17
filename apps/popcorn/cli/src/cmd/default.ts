/**
 * Default command: popcorn [project]
 *
 * Starts the TUI with an embedded worker process (RPC mode).
 * No HTTP server is started - all communication happens via RPC.
 */
import path from "path";
import { Command } from "commander";
import { Rpc } from "../rpc";
import type { rpc as workerRpc } from "../worker";
import type { Event } from "@popcorn/sdk/v2";
import { tui } from "@popcorn/tui/app";

declare const POPCORN_WORKER_PATH: string | undefined;

type RpcClient = ReturnType<typeof Rpc.client<typeof workerRpc>>;

interface DefaultOptions {
  model?: string;
  continue?: boolean;
  session?: string;
  prompt?: string;
  agent?: string;
}

/**
 * Create a custom fetch that forwards requests via RPC to the worker.
 */
function createWorkerFetch(client: RpcClient): typeof fetch {
  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const request = new Request(input, init);
    const body = request.body ? await request.text() : undefined;

    const result = await client.call("fetch", {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body,
    });

    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    });
  };
}

/**
 * Create an event source that receives events via RPC from the worker.
 */
function createEventSource(client: RpcClient, directory: string) {
  return {
    on: (handler: (event: Event) => void) =>
      client.on<Event>("event", (event) => {
        handler(event);
        if (event.type === "server.instance.disposed") {
          client.call("subscribe", { directory }).catch(() => {});
        }
      }),
  };
}

export const popcorn = new Command("start")
  .description("Start the popcorn TUI")
  .argument("[project]", "Path to start popcorn in")
  .option("-m, --model <model>", "Model to use (provider/model format)")
  .option("-c, --continue", "Continue the last session")
  .option("-s, --session <id>", "Session ID to continue")
  .option("--prompt <prompt>", "Initial prompt")
  .option("--agent <agent>", "Agent to use")
  .action(async (project: string | undefined, options: DefaultOptions) => {
    // Resolve working directory
    const baseCwd = process.env.PWD ?? process.cwd();
    const cwd = project ? path.resolve(baseCwd, project) : process.cwd();

    try {
      process.chdir(cwd);
    } catch {
      console.error(`Failed to change directory to ${cwd}`);
      process.exit(1);
    }

    // Spawn the worker - use define'd path in compiled binary, relative in dev
    const workerPath =
      typeof POPCORN_WORKER_PATH !== "undefined"
        ? POPCORN_WORKER_PATH
        : new URL("../worker.ts", import.meta.url).href;
    const worker = new Worker(workerPath, {
      env: Object.fromEntries(
        Object.entries(process.env).filter(
          (entry): entry is [string, string] => entry[1] !== undefined,
        ),
      ),
    });

    worker.onerror = (e) => {
      console.error("[worker error]", e);
    };

    // Create RPC client
    const client = Rpc.client<typeof workerRpc>(worker);

    // Handle process signals
    process.on("uncaughtException", (e) => {
      console.error("[uncaught exception]", e);
    });
    process.on("unhandledRejection", (e) => {
      console.error("[unhandled rejection]", e);
    });

    // Read piped input if any
    const piped = !process.stdin.isTTY ? await Bun.stdin.text() : undefined;
    const prompt = options.prompt
      ? piped
        ? piped + "\n" + options.prompt
        : options.prompt
      : piped;

    // Subscribe to events
    await client.call("subscribe", { directory: cwd });

    // Use RPC mode (no HTTP server)
    const url = "http://popcorn.internal";
    const customFetch = createWorkerFetch(client);
    const events = createEventSource(client, cwd);

    // Start the TUI
    await tui({
      url,
      fetch: customFetch,
      events,
      directory: cwd,
      args: {
        model: options.model,
        agent: options.agent,
        prompt,
        continue: options.continue,
        sessionID: options.session,
      },
      onExit: async () => {
        await client.call("shutdown", undefined);
      },
    });
  });
