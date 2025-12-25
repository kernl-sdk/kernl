import { Toolkit } from "kernl";

import { search } from "./search";
import { upsert } from "./upsert";

export const turbopuffer = new Toolkit({
  id: "turbopuffer",
  description: "Vector database for semantic search and retrieval",
  tools: [search, upsert],
});
