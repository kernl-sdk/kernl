import { Hono } from "hono";
import { z } from "zod";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import { UIMessageCodec, toUIMessageStream } from "@kernl-sdk/ai";
import { zValidator } from "@hono/zod-validator";

import { NotFoundError, ValidationError } from "@/lib/error";
import { generateTitle } from "@/lib/utils";
import type { Variables } from "@/types";

/**
 * POST /agents/:id/stream
 */
const StreamAgentBody = z
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

export const agents = new Hono<{ Variables: Variables }>();

/**
 * GET /agents
 *
 * List registered agents.
 */
agents.get("/", (c) => {
  const kernl = c.get("kernl");

  // (TODO): refactor to use MAgent for public API consumption
  const list = kernl.agents.list().map((agent) => ({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    model: {
      provider: agent.model.provider,
      modelId: agent.model.modelId,
    },
    memory: agent.memory,
    toolkits: agent.toolkits.map((t) => t.id),
  }));

  return c.json({ agents: list });
});

/**
 * POST /agents/:id/stream
 *
 * Stream agent execution.
 */
agents.post("/:id/stream", zValidator("json", StreamAgentBody), async (c) => {
  const kernl = c.get("kernl");
  const id = c.req.param("id");

  const agent = kernl.agents.get(id);
  if (!agent) {
    throw new NotFoundError(`Agent "${id}" not found`);
  }

  const { tid, message, title, titlerAgentId } = c.req.valid("json");

  // --- thread creation ---
  const existing = await agent.threads.get(tid); // ~10-40ms
  if (!existing) {
    // :a: explicit title provided - create with it
    if (typeof title === "string" && title !== "$auto" && title.trim()) {
      await agent.threads.create({ tid, title: title.trim() });
    }
    // :b: $auto title - generate async
    else if (title === "$auto" && titlerAgentId) {
      await agent.threads.create({ tid }); // ~10-40ms

      const titler = kernl.agents.get(titlerAgentId);
      if (!titler) {
        throw new ValidationError(
          `Titler agent ${titlerAgentId} does not exist`,
        );
      }

      // fire-and-forget title generation
      generateTitle(message, titler, async (title) => {
        await kernl.threads.update(tid, { title });
      });
      // :c: no title
    } else {
      await agent.threads.create({ tid });
    }
  }

  const input = await UIMessageCodec.decode(message as unknown as UIMessage);
  const stream = agent.stream(input, { threadId: tid });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(stream),
  });
});
