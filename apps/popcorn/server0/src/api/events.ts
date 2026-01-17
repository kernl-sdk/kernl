import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

export const events = new Hono();

/**
 * Global SSE event stream.
 * OpenCode UI connects here for real-time updates across all sessions.
 */
events.get("/", async (cx) => {
  return streamSSE(cx, async (stream) => {
    // send initial connected event
    await stream.writeSSE({
      event: "connected",
      data: JSON.stringify({ connected: true }),
    });

    // heartbeat loop
    const heartbeat = setInterval(async () => {
      try {
        await stream.writeSSE({
          event: "heartbeat",
          data: JSON.stringify({ time: Date.now() }),
        });
      } catch {
        clearInterval(heartbeat);
      }
    }, 30000);

    // keep connection open until client disconnects
    await new Promise<void>((resolve) => {
      cx.req.raw.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        resolve();
      });
    });
  });
});

/**
 * Session-scoped SSE event stream.
 * OpenCode UI subscribes to session-specific updates.
 */
events.get("/:sessionId", async (cx) => {
  const sessionId = cx.req.param("sessionId");

  return streamSSE(cx, async (stream) => {
    await stream.writeSSE({
      event: "connected",
      data: JSON.stringify({ connected: true, sessionId }),
    });

    const heartbeat = setInterval(async () => {
      try {
        await stream.writeSSE({
          event: "heartbeat",
          data: JSON.stringify({ time: Date.now() }),
        });
      } catch {
        clearInterval(heartbeat);
      }
    }, 30000);

    await new Promise<void>((resolve) => {
      cx.req.raw.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        resolve();
      });
    });
  });
});
