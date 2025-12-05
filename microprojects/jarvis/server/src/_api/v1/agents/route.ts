import { Hono, type Context } from "hono";
import { createUIMessageStreamResponse } from "ai";
import { UIMessageCodec, toUIMessageStream } from "@kernl-sdk/ai";

import { NotFoundError } from "@/lib/error";
import { generateTitle } from "@/lib/utils";

import { jarvis } from "@/agents/jarvis";
import { titler } from "@/agents/title-agent";

const agents = new Hono();

/**
 * - Agent routes :: /agents -
 */
// agents.get("/", list);
agents.post("/:id/stream", stream);

export default agents;

// --- handlers ---

/**
 * @route POST /v1/agents/:id/stream
 *
 * Stream agent execution with real-time updates.
 */
async function stream(cx: Context) {
  const id = cx.req.param("id");

  // for now, only support jarvis agent
  if (id !== "jarvis") {
    throw new NotFoundError("Agent not found");
  }

  const body = await cx.req.json();
  const { tid, message } = body;

  const input = await UIMessageCodec.decode(message); // validates and converts

  const existing = await jarvis.threads.get(tid);
  if (!existing) {
    // if thread doesn't exist, create it and generate title asynchronously
    await jarvis.threads.create({ tid });
    generateTitle(message, titler, async (title) => {
      await jarvis.threads.update(tid, { title });
    });
  }

  const kstream = jarvis.stream(input, {
    threadId: tid,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(kstream),
  });
}
