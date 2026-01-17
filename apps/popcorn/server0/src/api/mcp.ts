import { Hono } from "hono";

export const mcp = new Hono();

mcp.get("/", (cx) => {
  return cx.json({});
});

mcp.get("/status", (cx) => {
  return cx.json({});
});
