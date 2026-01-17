import { Hono } from "hono";

export const app = new Hono();

app.get("/agents", (cx) => {
  return cx.json([
    {
      name: "Coder",
      description: "A coding assistant agent",
      mode: "primary" as const,
      permission: [],
      options: {},
    },
  ]);
});
