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

  override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      limit: this.limit,
      chain: this.chain,
    };
  }
}

/**
 * Thrown when a handoff targets an agent that is not registered.
 */
export class HandoffTargetNotFoundError extends RuntimeError {
  readonly from: string;
  readonly to: string;
  readonly available: string[];

  constructor(from: string, to: string, available: string[]) {
    super(
      `Agent "${from}" tried to handoff to "${to}", but it's not registered. ` +
        `Available: ${available.join(", ")}`
    );
    this.name = "HandoffTargetNotFoundError";
    this.from = from;
    this.to = to;
    this.available = available;
  }

  override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      from: this.from,
      to: this.to,
      available: this.available,
    };
  }
}
