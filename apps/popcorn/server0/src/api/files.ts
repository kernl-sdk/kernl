import { Hono } from "hono";

export const files = new Hono();

/**
 * Find files matching a pattern.
 * Used by OpenCode UI for file picker / search.
 */
files.get("/find", async (cx) => {
  const pattern = cx.req.query("pattern") || "*";
  // TODO: implement glob/find
  return cx.json([]);
});

/**
 * Read file contents.
 */
files.get("/read", async (cx) => {
  const path = cx.req.query("path");
  if (!path) {
    return cx.json({ error: "path required" }, 400);
  }
  // TODO: read file
  return cx.json({ path, content: "" });
});
