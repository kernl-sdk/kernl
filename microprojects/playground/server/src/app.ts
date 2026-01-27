import { join } from "path";
import { Kernl } from "kernl";
import { libsql } from "@kernl-sdk/libsql";

import { echo } from "./agents/echo";
import { titler } from "./agents/titler";
import { jarvis, guardrailer } from "./agents/jarvis";
import { grok } from "./agents/grok";

export function build(): Kernl {
  const kernl = new Kernl({
    storage: {
      db: libsql({
        url: `file:${join(process.env.HOME!, ".kernl", "playground.db")}`,
      }),
    },
  });

  // --- agents ---
  kernl.register(echo);
  kernl.register(titler);
  kernl.register(jarvis);
  kernl.register(guardrailer);
  kernl.register(grok);

  return kernl;
}
