import { Hono, type Context } from "hono";
import type { Kernl } from "@kernl-sdk/core";
import { historyToUIMessages } from "@kernl-sdk/ai";

import { NotFoundError } from "@/lib/error";

const threads = new Hono();

/**
 * - Thread routes :: /threads -
 */
threads.get("/", list);
threads.get("/:tid", get);
threads.delete("/:tid", del);

export default threads;

// --- handlers ---

/**
 * @route GET /v1/threads
 *
 * List stored threads.
 */
async function list(cx: Context) {
  const kernl = cx.get("kernl") as Kernl;

  const query = cx.req.query();
  const limit = query.limit ? parseInt(query.limit) : undefined;
  const agentId = query.agentId;

  const threads = await kernl.threads.list({ agentId, limit });

  return cx.json({
    threads: threads,
    count: threads.length,
  });
}

/**
 * @route GET /v1/threads/:tid
 *
 * Get a thread with all its events.
 */
async function get(cx: Context) {
  const kernl = cx.get("kernl") as Kernl;
  const tid = cx.req.param("tid");

  const thread = await kernl.threads.get(tid);
  if (!thread) {
    throw new NotFoundError("Thread not found");
  }

  const history = thread.history ?? [];

  return cx.json({
    ...thread,
    history: historyToUIMessages(history), // make sure to convert to UIMessage format
  });
}

/**
 * @route DELETE /v1/threads/:tid
 *
 * Delete a thread and all associated events.
 */
async function del(cx: Context) {
  const kernl = cx.get("kernl") as Kernl;
  const tid = cx.req.param("tid");

  await kernl.threads.delete(tid);

  return cx.json({ success: true });
}
