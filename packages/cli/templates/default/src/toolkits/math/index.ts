import { FunctionToolkit } from "kernl";

import { add } from "./add";
import { subtract } from "./subtract";
import { multiply } from "./multiply";
import { divide } from "./divide";

export const math = new FunctionToolkit({
  id: "math",
  description: "",
  tools: [add, subtract, multiply, divide],
});
