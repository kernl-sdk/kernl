import { z } from "zod";

/**
 * POST /agents/:id/stream
 */
export const StreamAgentBody = z
  .object({
    tid: z.string().min(1, "tid is required"),
    message: z.record(z.string(), z.unknown()),
    title: z.union([z.string(), z.literal("$auto")]).optional(),
    titlerAgentId: z.string().optional(),
  })
  .refine((data) => data.title !== "$auto" || data.titlerAgentId, {
    message: "titlerAgentId required when title is $auto",
    path: ["titlerAgentId"],
  });

export type StreamAgentBody = z.infer<typeof StreamAgentBody>;
