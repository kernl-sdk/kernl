import { Kernl } from "kernl";

import { echo } from "./agents/echo";
import { titler } from "./agents/titler";

export function build(): Kernl {
  const kernl = new Kernl();

  // --- agents ---
  kernl.register(echo);
  kernl.register(titler);

  return kernl;
}
