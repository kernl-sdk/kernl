import { Daytona, Sandbox } from "@daytonaio/sdk";
import type { Context } from "kernl";

export const daytona = new Daytona();

/**
 * Daytona context extension for sandbox management.
 */
export interface SandboxContext {
  sandboxId?: string;
  desktopStarted?: boolean;
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

  // auto-provision a new sandbox with sensible defaults
  const sandbox = await daytona.create({
    language: "python", // <- adjust to whatever language you want your sandbox to be
    autoStopInterval: 30, // 30 min idle timeout
  });

  context.sandboxId = sandbox.id;

  return sandbox;
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
