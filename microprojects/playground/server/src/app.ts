import { Kernl } from "kernl";
import { pgvector, postgres } from "@kernl-sdk/pg";
import "@kernl-sdk/ai/openai";

// import { turbopuffer } from "@kernl-sdk/turbopuffer";

import { echo } from "./agents/echo";
import { sleeper } from "./agents/sleeper";
import { titler } from "./agents/titler";
import { watson } from "./agents/watson";

export function build(): Kernl {
  const kernl = new Kernl({
    storage: {
      db: postgres({ connstr: process.env.DATABASE_URL! }),
      vector: pgvector({ connstr: process.env.DATABASE_URL! }),
    },
    scheduler: true,
  });

  // --- agents ---
  kernl.register(echo);
  kernl.register(sleeper);
  kernl.register(titler);
  kernl.register(watson);

  // start wakeup scheduler
  kernl.schedule?.start();

  return kernl;
}

// vector: turbopuffer({
//   apiKey: process.env.TURBOPUFFER_API_KEY!,
//   region: "api",
// }),
