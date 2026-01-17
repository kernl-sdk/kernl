import { Toolkit } from "kernl";

import { glob } from "./glob";
import { grep } from "./grep";
import { codesearch } from "./codesearch";

export const search = new Toolkit({
  id: "search",
  description:
    "Code search operations: glob patterns, content search, and documentation lookup",
  tools: [glob, grep, codesearch],
});
