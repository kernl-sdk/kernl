import { isHandoffResult, type HandoffResult } from "./types";

/**
 * Extracts a handoff result from an agent's output.
 * Checks both direct results and wrapped results (e.g., { output: HandoffResult }).
 */
export function extractHandoff(result: unknown): HandoffResult | null {
  if (result == null) {
    return null;
  }

  // Check if result is directly a handoff
  if (isHandoffResult(result)) {
    return result;
  }

  // Check if result has an output property that is a handoff
  if (typeof result === "object" && "output" in result) {
    const output = (result as { output: unknown }).output;
    if (isHandoffResult(output)) {
      return output;
    }
  }

  return null;
}
