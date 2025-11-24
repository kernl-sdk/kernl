import { Toolkit } from "kernl";

import { add } from "./add";
import { subtract } from "./subtract";
import { multiply } from "./multiply";
import { divide } from "./divide";

export const math = new Toolkit({
  id: "math",
  description: "A collection of basic mathematical operations",
  tools: [add, subtract, multiply, divide],
});
