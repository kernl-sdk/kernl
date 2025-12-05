import { z } from "zod";

/**
 * GET /threads query params
 */
export const ThreadsListQuery = z.object({
  agent_id: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  cursor: z.string().optional(),
});

export type ThreadsListQuery = z.infer<typeof ThreadsListQuery>;
