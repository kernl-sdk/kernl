import { RuntimeError } from "@/lib/error";
import type { HandoffRecord } from "./types";

/**
 * Thrown when the maximum number of handoffs is exceeded.
 */
export class MaxHandoffsExceededError extends RuntimeError {
  readonly limit: number;
  readonly chain: HandoffRecord[];

  constructor(limit: number, chain: HandoffRecord[]) {
    const path = chain.map((h) => h.from).join(" → ");
    super(`Max handoffs (${limit}) exceeded. Chain: ${path}`);
    this.name = "MaxHandoffsExceededError";
    this.limit = limit;
    this.chain = chain;
  }
}

/**
 * Thrown when a handoff targets an agent that is not registered.
 */
export class HandoffTargetNotFoundError extends RuntimeError {
  constructor(from: string, to: string, available: string[]) {
    super(
      `Agent "${from}" tried to handoff to "${to}", but it's not registered. ` +
        `Available: ${available.join(", ")}`
    );
    this.name = "HandoffTargetNotFoundError";
  }
}
