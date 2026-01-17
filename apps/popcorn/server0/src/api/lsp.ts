import { Hono } from "hono";

export const lsp = new Hono();

lsp.get("/", (cx) => {
  return cx.json([]);
});

lsp.get("/status", (cx) => {
  return cx.json([]);
});
