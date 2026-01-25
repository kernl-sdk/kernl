import type { Context } from "kernl";
import { Daytona, Sandbox, Image } from "@daytonaio/sdk";

export const daytona = new Daytona();

const SANDBOX_IMAGE = Image.base("node:20-slim");

/**
 * Git credentials for authenticated operations.
 * Set this in context to enable push/pull to private repos.
 */
export interface GitCredentials {
  username: string;
  token: string;
}

/**
 * Daytona context extension for sandbox management.
 */
export interface SandboxContext {
  sandboxId?: string;
  desktopStarted?: boolean;
  git?: GitCredentials;
}

/**
 * Gets git credentials from context if available.
 */
export function getGitCredentials(ctx: Context<SandboxContext>): {
  username?: string;
  password?: string;
} {
  const { git } = ctx.context;
  return git ? { username: git.username, password: git.token } : {};
}

/**
 * Gets or creates a sandbox for the current context.
 *
 * Sandboxes are auto-provisioned on first use and cached in context.
 * This allows tools to operate without explicit sandbox lifecycle management.
 * For custom sandbox configuration, set `ctx.context.sandboxId` before
 * invoking tools, or create a sandbox programmatically and assign its ID.
 */
export async function getSandbox(
  ctx: Context<SandboxContext>,
): Promise<Sandbox> {
  const { context } = ctx;

  if (context.sandboxId) {
    const sandbox = await daytona.get(context.sandboxId);

    if (sandbox.state !== "started") {
      await sandbox.start();
    }

    return sandbox;
  }

  // auto-provision a new sandbox
  const sandbox = await daytona.create({
    image: SANDBOX_IMAGE,
    autoStopInterval: 15,
    resources: { disk: 10 },
  });

  context.sandboxId = sandbox.id;

  return sandbox;
}

/**
 * Creates and sets up a new sandbox with kernl repo for sandex sessions.
 * Call this when a new sandex chat starts.
 * Creates sandbox immediately, fires and forgets clone/install.
 */
export async function initSandbox(): Promise<string> {
  console.log("[sandbox] creating...");
  const sandbox = await daytona.create({
    image: SANDBOX_IMAGE,
    autoStopInterval: 30,
    resources: { disk: 10 },
  });

  // Fire and forget setup
  (async () => {
    const log = (msg: string) => sandbox.process.executeCommand(`echo "${msg}" >> /tmp/setup.log`);
    const run = async (cmd: string, cwd?: string) => {
      await log(`[${new Date().toISOString()}] running: ${cmd}`);
      try {
        const result = await sandbox.process.executeCommand(cmd, cwd);
        await log(`[${new Date().toISOString()}] success: ${JSON.stringify(result).slice(0, 500)}`);
        return result;
      } catch (err) {
        await log(`[${new Date().toISOString()}] error: ${err}`);
        throw err;
      }
    };

    await run("apt-get update && apt-get install -y git");
    await run("git clone https://github.com/kernl-sdk/kernl.git");
    await run("npm install -g pnpm && pnpm install", "kernl");

    await log("[sandbox] ready");
  })().catch((err) => console.error("[sandbox] setup error:", err));

  return sandbox.id;
}

/**
 * Gets a sandbox with desktop environment running.
 *
 * Automatically starts the desktop (Xvfb, xfce4, x11vnc, novnc) on first use.
 * Used by computer use tools that need the desktop environment.
 */
export async function ensureDesktop(
  ctx: Context<SandboxContext>,
): Promise<Sandbox> {
  const sandbox = await getSandbox(ctx);
  const { context } = ctx;

  if (!context.desktopStarted) {
    await sandbox.computerUse.start();
    context.desktopStarted = true;
  }

  return sandbox;
}
