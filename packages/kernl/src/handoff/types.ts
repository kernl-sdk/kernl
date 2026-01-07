/**
 * Result returned by the handoff tool to signal agent transfer.
 */
export interface HandoffResult {
  kind: "handoff";
  to: string;
  message: string;
  from: string;
}

/**
 * Record of a handoff in the execution chain.
 */
export interface HandoffRecord {
  from: string;
  to: string;
  message: string;
  timestamp: Date;
}

/**
 * Extended run result with handoff chain information.
 */
export interface HandoffRunResult {
  output: string;
  handoffChain: HandoffRecord[];
  finalAgent: string;
}

/**
 * Type guard for HandoffResult.
 */
export function isHandoffResult(value: unknown): value is HandoffResult {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    obj.kind === "handoff" &&
    typeof obj.to === "string" &&
    typeof obj.message === "string" &&
    typeof obj.from === "string"
  );
}
