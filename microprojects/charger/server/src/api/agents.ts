import { Hono } from "hono";
import { z } from "zod";
import { Kernl } from "kernl";
import { zValidator } from "@hono/zod-validator";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { UIMessageCodec, toUIMessageStream } from "@kernl-sdk/ai";

import { NotFoundError } from "@/lib/error";

const StreamAgentBody = z.object({
  tid: z.string().min(1, "tid is required"),
  message: z.record(z.string(), z.unknown()),
});

type Variables = { kernl: Kernl };

const agents = new Hono<{ Variables: Variables }>();

/**
 * GET /agents
 *
 * List all registered agents.
 */
agents.get("/", async (c) => {
  const kernl = c.get("kernl");
  const list = kernl.agents.list();

  return c.json({
    agents: list.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      model: {
        provider: a.model.provider,
        modelId: a.model.modelId,
      },
    })),
  });
});

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
