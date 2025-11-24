import { Hono, type Context } from "hono";
import { createUIMessageStreamResponse } from "ai";
import { UIMessageCodec, toUIMessageStream } from "@kernl-sdk/ai";

import { NotFoundError } from "@/lib/error";

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

  // if thread doesn't exist, create it with a generated title before streaming
  const existing = await jarvis.threads.get(tid);
  if (!existing) {
    const prompt = `User message: ${JSON.stringify(message)}`;
    const res = await titler.run(prompt); // haiku 4.5

    const _thread = await jarvis.threads.create({
      tid,
      title: res.response,
    });
  }

  const kstream = jarvis.stream(input, {
    threadId: tid,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream(kstream),
  });
}
