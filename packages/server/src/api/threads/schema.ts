import { z } from "zod";

/**
 * GET /threads query params
 */
export const ThreadsListQuery = z.object({
  agentId: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
  cursor: z.string().optional(),
});

export type ThreadsListQuery = z.infer<typeof ThreadsListQuery>;

/**
 * POST /threads
 *
 * Create a new thread.
 */
export const ThreadCreateBody = z.object({
  tid: z.string().optional(),
  agentId: z.string().min(1, "agentId is required"),
  title: z.string().optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export type ThreadCreateBody = z.infer<typeof ThreadCreateBody>;

/**
 * POST /threads/:tid/stream
 *
 * AI SDK adapter request body.
 */
export const StreamThreadBody = z.object({
  message: z.record(z.string(), z.unknown()),
});

export type StreamThreadBody = z.infer<typeof StreamThreadBody>;
