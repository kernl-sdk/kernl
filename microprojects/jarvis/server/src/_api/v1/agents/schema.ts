import { z } from "zod";

/**
 * POST /agents/:id/stream
 */
export const StreamAgentBody = z.object({
  tid: z.string().min(1, "tid is required"),
  message: z.record(z.string(), z.unknown()),
});

export type StreamAgentBody = z.infer<typeof StreamAgentBody>;
