import { Hono, type Context } from "hono";
import type { Kernl } from "@kernl-sdk/core";

import { NotFoundError } from "@/lib/error";

const threads = new Hono();

/**
 * - Thread routes :: /threads -
 */
threads.get("/", list);
threads.get("/:tid", get);
threads.delete("/:tid", del);

export default threads;

// --- Handlers ---

/**
 * @route GET /v1/threads
 *
 * List all threads (doesn't return thread events by default).
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

  return cx.json(thread);
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
