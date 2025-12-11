import { Toolkit } from "kernl";

import { greet } from "./greet";

export const hello = new Toolkit({
  id: "hello",
  description: "A simple greeting toolkit",
  tools: [greet],
});
