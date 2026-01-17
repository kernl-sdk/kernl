import { serve } from "@hono/node-server";
import { build } from "./app";

const app = build();
const port = Number(process.env.PORT) || 3100;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`server0 running on http://localhost:${info.port}`);
});
