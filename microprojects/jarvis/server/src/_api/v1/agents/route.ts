import { Hono, type Context } from "hono";
import { createUIMessageStreamResponse, UIMessage } from "ai";
import { UIMessageCodec, toUIMessageStream } from "@kernl-sdk/ai";

import { NotFoundError } from "@/lib/error";

import { jarvis } from "@/agents/jarvis";

const agents = new Hono();

/**
 * - Agent routes :: /agents -
 */
// agents.get("/", list);
// agents.post("/:id/run", run);
agents.post("/:id/stream", stream);

export default agents;

// --- Handlers ---

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

  const kstream = jarvis.stream(input, {
    threadId: tid,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(kstream),
  });
}
