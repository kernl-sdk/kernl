import { Hono } from "hono";
import { Kernl } from "kernl";
import { zValidator } from "@hono/zod-validator";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { UIMessageCodec, toUIMessageStream } from "@kernl-sdk/ai";

import { NotFoundError } from "@/lib/error";

import { StreamAgentBody } from "./schema";

type Variables = { kernl: Kernl };

const agents = new Hono<{ Variables: Variables }>();

/**
 * POST /agents/:id/stream
 *
 * Stream agent execution with real-time updates.
 */
agents.post("/:id/stream", zValidator("json", StreamAgentBody), async (c) => {
  const kernl = c.get("kernl");
  const id = c.req.param("id");

  const agent = kernl.agents.get(id);
  if (!agent) {
    throw new NotFoundError(`Agent "${id}" not found`);
  }

  const { tid, message } = c.req.valid("json");

  const input = await UIMessageCodec.decode(message as unknown as UIMessage);

  const existing = await agent.threads.get(tid);
  if (!existing) {
    await agent.threads.create({ tid });
  }

  const kstream = agent.stream(input, { threadId: tid });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(kstream),
  });
});

export default agents;
