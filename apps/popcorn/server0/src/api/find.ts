import { Hono } from "hono";
import * as File from "@/lib/file";

type Variables = {
  directory: string;
};

export const find = new Hono<{ Variables: Variables }>();

/**
 * GET /find/file
 *
 * Search for files and directories.
 *
 * Query params:
 * - query: string - fuzzy search query
 * - directory: string (optional) - override directory from header
 * - dirs: "true" | "false" - include directories (default: true)
 * - type: "file" | "directory" - filter by type
 * - limit: number - max results (default: 100)
 */
find.get("/file", async (cx) => {
  const query = cx.req.query("query") ?? "";
  const directory = cx.req.query("directory") || cx.get("directory");
  const dirs = cx.req.query("dirs") !== "false";
  const type = cx.req.query("type") as "file" | "directory" | undefined;
  const limit = parseInt(cx.req.query("limit") ?? "100", 10);

  const results = await File.search({
    query,
    directory,
    dirs,
    type,
    limit,
  });

  return cx.json(results);
});

find.get("/symbol", (cx) => {
  // Return empty array for now - symbol search stub
  return cx.json([]);
});

find.get("/text", (cx) => {
  // Return empty array for now - text search stub
  return cx.json([]);
});
