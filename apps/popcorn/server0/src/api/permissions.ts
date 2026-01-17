import { Hono } from "hono";

export const permissions = new Hono();

/**
 * List pending permission requests.
 * Maps to: kernl approval queue
 */
permissions.get("/", async (cx) => {
  // TODO: list pending approvals
  return cx.json([]);
});

/**
 * Respond to a permission request.
 * Maps to: kernl approval resolve
 */
permissions.post("/:id", async (cx) => {
  const id = cx.req.param("id");
  const body = await cx.req.json();
  const { granted } = body;
  // TODO: resolve approval in kernl
  return cx.json({ id, granted });
});
