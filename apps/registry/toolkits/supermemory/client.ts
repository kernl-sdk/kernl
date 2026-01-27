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

const DEFAULT_USER_ID = "default";

/**
 * Gets the user ID from context, falling back to a default.
 */
export function getUserId(ctx: SupermemoryContext): string {
  return ctx.userId ?? DEFAULT_USER_ID;
}
