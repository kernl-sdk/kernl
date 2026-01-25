import { Kernl } from "kernl";
import { pgvector, postgres } from "@kernl-sdk/pg";
// import { turbopuffer } from "@kernl-sdk/turbopuffer";

import { echo } from "./agents/echo";
import { titler } from "./agents/titler";
import { jarvis } from "./agents/jarvis";
import { grok } from "./agents/grok";

export function build(): Kernl {
  const kernl = new Kernl({
    storage: {
      db: postgres({ url: process.env.DATABASE_URL! }),
      vector: pgvector({ url: process.env.DATABASE_URL! }),
      // vector: turbopuffer({
      //   apiKey: process.env.TURBOPUFFER_API_KEY!,
      //   region: "api",
      // }),
    },
  });

  // --- agents ---
  kernl.register(echo);
  kernl.register(titler);
  kernl.register(jarvis);
  kernl.register(grok);

  return kernl;
}
