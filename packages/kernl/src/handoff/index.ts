export { isHandoffResult } from "./types";
export type { HandoffResult, HandoffRecord, HandoffRunResult } from "./types";

export { createHandoffTool } from "./tool";

export { extractHandoff } from "./utils";

export {
  MaxHandoffsExceededError,
  HandoffTargetNotFoundError,
} from "./errors";
