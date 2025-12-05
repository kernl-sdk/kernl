import { Kernl } from "kernl";
import { pgvector, postgres } from "@kernl-sdk/pg";
import { turbopuffer } from "@kernl-sdk/turbopuffer";

import { echo } from "./agents/echo";
import { titler } from "./agents/titler";

export function build(): Kernl {
  const kernl = new Kernl({
    storage: {
      db: postgres({ connstr: process.env.DATABASE_URL! }),
      vector: pgvector({ connstr: process.env.DATABASE_URL! }),
      // vector: turbopuffer({
      //   apiKey: process.env.TURBOPUFFER_API_KEY!,
      //   region: "api",
      // }),
    },
  });

  // --- agents ---
  kernl.register(echo);
  kernl.register(titler);

  return kernl;
}
