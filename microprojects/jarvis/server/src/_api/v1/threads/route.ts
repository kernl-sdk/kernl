import { Hono, type Context } from "hono";

import { UnimplementedError } from "@/lib/error";

const threads = new Hono();

/**
 * - Thread routes :: /threads -
 */
threads.get("/", list);
threads.post("/", create);
threads.get("/:tid", get);
// threads.put("/:tid", update);
threads.delete("/:tid", del);

export default threads;

// --- Handlers ---

/**
 * @route GET /v1/threads
 *
 * List all threads (doesn't return thread events by default).
 */
async function list(cx: Context) {
  return cx.json({ threads: [], count: 0 });
}

/**
 * @route POST /v1/threads
 *
 * Create a new thread.
 */
async function create(cx: Context) {
  throw new UnimplementedError();
}

/**
 * @route GET /v1/threads/:tid
 *
 * Get a thread with all its events.
 */
async function get(cx: Context) {
  const tid = cx.req.param("tid");
  throw new UnimplementedError();
}

/**
 * @route DELETE /v1/threads/:tid
 *
 * Delete a thread and all associated events.
 */
async function del(cx: Context) {
  const tid = cx.req.param("tid");
  throw new UnimplementedError();
}
