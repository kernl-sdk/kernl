import { Hono, type Context } from "hono";
import { Kernl } from "@kernl-sdk/core";
import { historyToUIMessages } from "@kernl-sdk/ai";

import { NotFoundError } from "@/lib/error";
import { logger } from "@/lib/logger";

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
 * @route GET /v1/threads?agent_id=...
 *
 * List stored threads.
 */
async function list(cx: Context) {
  const kernl = cx.get("kernl") as Kernl; // get the Kernl instance

  const query = cx.req.query();
  const limit = query.limit ? parseInt(query.limit) : undefined;
  const agentId = query.agent_id;

  const page = await kernl.threads.list({
    agentId,
    limit,
  });

  const threads = await page.collect();

  return cx.json({
    threads,
    count: threads.length,
  });
}

/**
 * @route GET /v1/threads/:tid
 *
 * Get a thread with all its events.
 */
async function get(cx: Context) {
  const kernl = cx.get("kernl") as Kernl; // get the Kernl instance
  const tid = cx.req.param("tid");

  const thread = await kernl.threads.get(tid, { history: { limit: 50 } }); // tail: 50 events
  if (!thread) {
    throw new NotFoundError("Thread not found");
  }

  const h = thread.history ?? [];
  const history = h.reverse(); // reverse so UI sees events chronologically.

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
