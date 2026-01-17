import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import * as events from "@/state/events";

export const global = new Hono();

global.get("/health", (cx) => {
  return cx.json({ healthy: true });
});

global.get("/event", (cx) => {
  return streamSSE(cx, async (stream) => {
    // send initial connection event (no directory for server events)
    stream.writeSSE({
      data: JSON.stringify({
        payload: {
          type: "server.connected",
          properties: {},
        },
      }),
    });

    // subscribe to global event bus
    const unsubscribe = events.subscribe(async (event) => {
      try {
        await stream.writeSSE({
          data: JSON.stringify(event),
        });
      } catch {
        // client disconnected
      }
    });

    // heartbeat every 30s to prevent WKWebView timeout
    const heartbeat = setInterval(() => {
      stream.writeSSE({
        data: JSON.stringify({
          payload: {
            type: "server.heartbeat",
            properties: {},
          },
        }),
      });
    }, 30_000);

    // keep connection open until client disconnects
    await new Promise<void>((resolve) => {
      stream.onAbort(() => {
        clearInterval(heartbeat);
        unsubscribe();
        resolve();
      });
    });
  });
});

global.post("/dispose", (cx) => {
  return cx.json({ disposed: true });
});
