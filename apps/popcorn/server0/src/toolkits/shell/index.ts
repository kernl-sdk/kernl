import { Toolkit } from "kernl";

import { bash } from "./bash";

export const shell = new Toolkit({
  id: "shell",
  description: "Shell command execution",
  tools: [bash],
});
