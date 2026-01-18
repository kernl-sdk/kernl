import { Hono } from "hono";
import { z } from "zod";
import { Kernl } from "kernl";
import { historyToUIMessages } from "@kernl-sdk/ai";
import { zValidator } from "@hono/zod-validator";

import { NotFoundError } from "@/lib/error";

const ThreadsListQuery = z.object({
  agent_id: z.string().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

type Variables = { kernl: Kernl };

const threads = new Hono<{ Variables: Variables }>();

/**
 * GET /threads
 */
threads.get("/", zValidator("query", ThreadsListQuery), async (c) => {
  const kernl = c.get("kernl");
  const { agent_id, limit } = c.req.valid("query");

  const page = await kernl.threads.list({
    agentId: agent_id,
    limit,
  });

  const list = await page.collect();

  return c.json({ threads: list, count: list.length });
});

/**
 * GET /threads/:tid
 */
threads.get("/:tid", async (c) => {
  const kernl = c.get("kernl");
  const tid = c.req.param("tid");

  const thread = await kernl.threads.get(tid);
  if (!thread) {
    throw new NotFoundError("Thread not found");
  }

  return c.json(thread);
});

/**
 * GET /threads/:tid/messages
 */
threads.get("/:tid/messages", async (c) => {
  const kernl = c.get("kernl");
  const tid = c.req.param("tid");

  const thread = await kernl.threads.get(tid, { history: { limit: 50 } });
  if (!thread) {
    throw new NotFoundError("Thread not found");
  }

  const history = (thread.history ?? []).reverse();

  return c.json({
    messages: historyToUIMessages(history),
  });
});

/**
 * DELETE /threads/:tid
 */
threads.delete("/:tid", async (c) => {
  const kernl = c.get("kernl");
  const tid = c.req.param("tid");

  await kernl.threads.delete(tid);

  return c.json({ success: true });
});

export default threads;
