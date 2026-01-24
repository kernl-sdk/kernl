/**
 * Modal Sandbox Client
 *
 * Lifecycle:
 * - Sandboxes auto-provision on first tool use
 * - Max lifetime: 24 hours, idle timeout: 15 minutes
 * - If a sandbox dies (timeout/terminated), a new one is created automatically
 *
 * Persistence:
 * - Call `snapshotSandbox(ctx)` to save filesystem state before timeout
 * - The snapshot image ID is stored in context.snapshotImageId
 * - New sandboxes restore from the snapshot if available
 * - Snapshots persist indefinitely on Modal's infrastructure
 */

import { ModalClient } from "modal";
import type { Context } from "kernl";

export const modal = new ModalClient();

/**
 * Modal sandbox context for managing sandbox lifecycle.
 */
export interface SandboxContext {
  appName?: string;
  sandboxId?: string;
  snapshotImageId?: string;
  image?: string;
  env?: Record<string, string>;
}

async function createSandbox(ctx: Context<SandboxContext>) {
  const { context } = ctx;

  const appName = context.appName ?? "kernl-sandbox";
  const app = await modal.apps.fromName(appName, { createIfMissing: true });

  // use snapshot if available, otherwise base image
  const image = context.snapshotImageId
    ? await modal.images.fromId(context.snapshotImageId)
    : modal.images.fromRegistry(context.image ?? "python:3.13-slim");

  const secrets = context.env
    ? [await modal.secrets.fromObject(context.env)]
    : undefined;

  const sandbox = await modal.sandboxes.create(app, image, {
    timeoutMs: 24 * 60 * 60 * 1000, // 24 hour max lifetime
    idleTimeoutMs: 15 * 60 * 1000, // 15 min inactivity timeout
    secrets,
  });

  context.sandboxId = sandbox.sandboxId;

  return sandbox;
}

/**
 * Gets or creates a sandbox for the current context.
 * Auto-provisions on first use, recreates if stale/terminated.
 */
export async function getSandbox(ctx: Context<SandboxContext>) {
  const { context } = ctx;

  if (!context.sandboxId) {
    return await createSandbox(ctx);
  }

  try {
    const sandbox = await modal.sandboxes.fromId(context.sandboxId);
    // health check - if sandbox is terminated this will throw
    await sandbox.exec(["true"]);
    return sandbox;
  } catch {
    context.sandboxId = undefined;
    return await createSandbox(ctx);
  }
}

/**
 * Snapshot the current sandbox filesystem.
 * Call this before the sandbox times out to preserve state.
 * Returns the snapshot image ID.
 */
export async function snapshotSandbox(ctx: Context<SandboxContext>) {
  const { context } = ctx;

  if (!context.sandboxId) {
    throw new Error("No sandbox to snapshot");
  }

  const sandbox = await modal.sandboxes.fromId(context.sandboxId);
  const image = await sandbox.snapshotFilesystem();

  context.snapshotImageId = image.imageId;

  return image.imageId;
}
