import { Hono } from "hono";
import { Kernl } from "kernl";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import {
  historyToUIMessages,
  UIMessageCodec,
  toUIMessageStream,
} from "@kernl-sdk/ai";
import { zValidator } from "@hono/zod-validator";

import { NotFoundError } from "@/lib/error";
import type { Variables } from "@/types";

import { ThreadsListQuery, ThreadCreateBody, StreamThreadBody } from "./schema";

export const threads = new Hono<{ Variables: Variables }>();

/**
 * GET /threads
 *
 * List stored threads with cursor-based pagination.
 */
threads.get("/", zValidator("query", ThreadsListQuery), async (c) => {
  const kernl = c.get("kernl") as Kernl;
  const { agentId, limit, cursor } = c.req.valid("query");

  const page = await kernl.threads.list({
    agentId,
    limit,
    cursor,
  });

  return c.json({ threads: page.data, next: page.nextCursor });
});

/**
 * POST /threads
 *
 * Create a new thread for an agent.
 */
threads.post("/", zValidator("json", ThreadCreateBody), async (c) => {
  const kernl = c.get("kernl") as Kernl;
  const { tid, agentId, title, context } = c.req.valid("json");

  const agent = kernl.agents.get(agentId);
  if (!agent) {
    throw new NotFoundError(`Agent "${agentId}" not found`);
  }

  const thread = await agent.threads.create({ tid, title, context });

  return c.json(thread);
});

/**
 * GET /threads/:tid/messages
 *
 * Get thread messages as UIMessages (AI SDK adapter).
 */
threads.get("/:tid/messages", async (c) => {
  const kernl = c.get("kernl") as Kernl;
  const tid = c.req.param("tid");

  const thread = await kernl.threads.get(tid, { history: { limit: 50 } });
  if (!thread) {
    throw new NotFoundError("Thread not found");
  }

  const history = (thread.history ?? []).reverse();

  return c.json({ messages: historyToUIMessages(history) });
});

/**
 * POST /threads/:tid/stream
 *
 * Stream to an existing thread (AI SDK adapter).
 * The thread determines which agent handles the request.
 */
threads.post(
  "/:tid/stream",
  zValidator("json", StreamThreadBody),
  async (c) => {
    const kernl = c.get("kernl") as Kernl;
    const tid = c.req.param("tid");

    const thread = await kernl.threads.get(tid);
    if (!thread) {
      throw new NotFoundError("Thread not found");
    }

    const agent = kernl.agents.get(thread.agentId);
    if (!agent) {
      throw new NotFoundError(`Agent "${thread.agentId}" not found`);
    }

    const { message } = c.req.valid("json");
    const input = await UIMessageCodec.decode(message as unknown as UIMessage);
    const stream = agent.stream(input, { threadId: tid });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream(stream),
    });
  },
);

/**
 * GET /threads/:tid
 *
 * Get thread metadata.
 */
threads.get("/:tid", async (c) => {
  const kernl = c.get("kernl") as Kernl;
  const tid = c.req.param("tid");

  const thread = await kernl.threads.get(tid);
  if (!thread) {
    throw new NotFoundError("Thread not found");
  }

  return c.json(thread);
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
