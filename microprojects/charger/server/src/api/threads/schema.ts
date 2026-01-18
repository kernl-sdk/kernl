import { z } from "zod";

export const ThreadsListQuery = z.object({
  agent_id: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export type ThreadsListQuery = z.infer<typeof ThreadsListQuery>;
