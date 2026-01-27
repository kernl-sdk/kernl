import Supermemory from "supermemory";

/**
 * Supermemory client singleton.
 * Requires SUPERMEMORY_API_KEY environment variable.
 */
export const supermemory = new Supermemory({
  apiKey: process.env.SUPERMEMORY_API_KEY,
});

/**
 * Context for Supermemory toolkit operations.
 *
 * These fields are examples of how you might partition documents.
 * Customize based on your application's multi-tenancy needs.
 */
export interface SupermemoryContext {
  /** Example: partition by app namespace (e.g. "myapp", "staging") */
  namespace?: string;

  /** Example: partition by user (e.g. "user_123") */
  userId?: string;
}

/**
 * Builds a container tag from context fields.
 * Customize this to match your partitioning strategy.
 * Defaults to "playground" if no context is provided.
 */
export function getContainerTag(ctx: SupermemoryContext): string {
  const parts: string[] = [];
  if (ctx.namespace) parts.push(ctx.namespace);
  if (ctx.userId) parts.push(ctx.userId);
  return parts.length > 0 ? parts.join("_") : "default";
}
