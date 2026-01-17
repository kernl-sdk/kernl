import { Hono } from "hono";

export const command = new Hono();

command.get("/", (cx) => {
  return cx.json([]);
});
