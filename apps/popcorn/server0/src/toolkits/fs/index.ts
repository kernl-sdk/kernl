import { Toolkit } from "kernl";

import { read } from "./read";
import { write } from "./write";
import { edit } from "./edit";
import { ls } from "./ls";

export const fs = new Toolkit({
  id: "fs",
  description: "Filesystem operations: read, write, edit, and list files",
  tools: [read, write, edit, ls],
});
