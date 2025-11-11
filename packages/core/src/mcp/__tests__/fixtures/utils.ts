import { MCPServerStdio } from "../../stdio";
import type { MCPServer } from "../../base";

/**
 * Helper to run a test with an MCP server, ensuring cleanup.
 */
export async function withMCPServer<T>(
  serverPath: string,
  fn: (server: MCPServerStdio) => Promise<T>
): Promise<T> {
  const server = new MCPServerStdio({
    id: "test-server",
    command: "npx",
    args: ["tsx", serverPath],
  });

  try {
    await server.connect();
    return await fn(server);
  } finally {
    await server.close();
  }
}

/**
 * Helper to create a server without auto-connecting.
 */
export function createMCPServer(
  serverPath: string,
  options: { id?: string; cacheToolsList?: boolean } = {}
): MCPServerStdio {
  return new MCPServerStdio({
    id: options.id ?? "test-server",
    command: "npx",
    args: ["tsx", serverPath],
    cacheToolsList: options.cacheToolsList,
  });
}

/**
 * Wait for a condition to be true or timeout.
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}
