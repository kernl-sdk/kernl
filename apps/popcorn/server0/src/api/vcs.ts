import { Hono } from "hono";

export const vcs = new Hono();

vcs.get("/", (cx) => {
  return cx.json({ branch: "main" });
});
