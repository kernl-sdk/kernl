import { Hono } from "hono";
import { Kernl } from "kernl";
import { historyToUIMessages } from "@kernl-sdk/ai";
import { zValidator } from "@hono/zod-validator";

import { NotFoundError } from "@/lib/error";
import type { Variables } from "@/types";

import { ThreadsListQuery } from "./schema";

export const threads = new Hono<{ Variables: Variables }>();

/**
 * GET /threads
 *
 * List stored threads with cursor-based pagination.
 */
threads.get("/", zValidator("query", ThreadsListQuery), async (c) => {
  const kernl = c.get("kernl") as Kernl;
  const { agent_id, limit, cursor } = c.req.valid("query");

  const page = await kernl.threads.list({
    agentId: agent_id,
    limit,
    cursor,
  });

  return c.json({ threads: page.data, next: page.nextCursor });
});

/**
 * GET /threads/:tid
 *
 * Get a thread with its history.
 */
threads.get("/:tid", async (c) => {
  const kernl = c.get("kernl") as Kernl;
  const tid = c.req.param("tid");

  const thread = await kernl.threads.get(tid, { history: { limit: 50 } });
  if (!thread) {
    throw new NotFoundError("Thread not found");
  }

  const history = (thread.history ?? []).reverse();

  return c.json({
    ...thread,
    history: historyToUIMessages(history),
  });
});

/**
 * DELETE /threads/:tid
 *
 * Delete a thread and all associated events.
 */
threads.delete("/:tid", async (c) => {
  const kernl = c.get("kernl") as Kernl;
  const tid = c.req.param("tid");

  await kernl.threads.delete(tid);

  return c.json({ success: true });
});
