import { describe, it, expect, beforeAll, afterAll } from "vitest";

import type {
  RealtimeServerEvent,
  RealtimeConnection,
} from "@kernl-sdk/protocol";
import { OpenAIRealtimeModel } from "../realtime";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

describe.skipIf(!OPENAI_API_KEY)("OpenAI Realtime Integration", () => {
  let model: OpenAIRealtimeModel;

  beforeAll(() => {
    model = new OpenAIRealtimeModel("gpt-realtime", {
      apiKey: OPENAI_API_KEY,
    });
  });

  it("should connect and receive session.created", async () => {
    const conn = await model.connect();
    const events: RealtimeServerEvent[] = [];

    const sessionCreated = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("timeout")), 10000);
      conn.on("event", (e: RealtimeServerEvent) => {
        events.push(e);
        if (e.kind === "session.created") {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    await sessionCreated;
    conn.close();

    expect(events.some((e) => e.kind === "session.created")).toBe(true);
    expect(conn.sessionId).toBeTruthy();
  });

  it("should complete text round-trip", async () => {
    const conn = await model.connect();
    const events: RealtimeServerEvent[] = [];

    conn.on("event", (e: RealtimeServerEvent) => {
      events.push(e);
    });

    // wait for session
    await waitFor(conn, "session.created");

    // configure text-only mode
    conn.send({
      kind: "session.update",
      config: {
        modalities: ["text"],
        instructions: "You are a helpful assistant. Be very brief.",
      },
    });

    await waitFor(conn, "session.updated");

    // add user message
    conn.send({
      kind: "item.create",
      item: {
        kind: "message",
        id: "test-msg-1",
        role: "user",
        content: [{ kind: "text", text: "Say exactly: hello world" }],
      },
    });

    // trigger response
    conn.send({ kind: "response.create" });

    // wait for response to complete
    await waitFor(conn, "response.done", 15000);

    conn.close();

    // verify event flow
    const kinds = events.map((e) => e.kind);
    expect(kinds).toContain("session.created");
    expect(kinds).toContain("session.updated");
    expect(kinds).toContain("response.created");
    expect(kinds).toContain("response.done");

    // verify we got text output
    const textOutput = events.find((e) => e.kind === "text.output");
    expect(textOutput).toBeDefined();
    if (textOutput?.kind === "text.output") {
      expect(textOutput.text.toLowerCase()).toContain("hello");
    }

    // verify response completed successfully
    const done = events.find((e) => e.kind === "response.done");
    if (done?.kind === "response.done") {
      expect(done.status).toBe("completed");
    }
  });

  it("should handle tool calling", { timeout: 10000 }, async () => {
    const conn = await model.connect();
    const events: RealtimeServerEvent[] = [];

    conn.on("event", (e: RealtimeServerEvent) => {
      events.push(e);
    });

    await waitFor(conn, "session.created");

    // configure with a tool
    conn.send({
      kind: "session.update",
      config: {
        modalities: ["text"],
        instructions: "You have access to tools. Use them when appropriate.",
        tools: [
          {
            kind: "function",
            name: "get_weather",
            description: "Get the current weather for a location",
            parameters: {
              type: "object",
              properties: {
                location: { type: "string", description: "City name" },
              },
              required: ["location"],
            },
          },
        ],
      },
    });

    await waitFor(conn, "session.updated");

    // ask about weather
    conn.send({
      kind: "item.create",
      item: {
        kind: "message",
        id: "test-msg-2",
        role: "user",
        content: [{ kind: "text", text: "What is the weather in Tokyo?" }],
      },
    });

    conn.send({ kind: "response.create" });

    // wait for tool call
    const toolCall = await waitFor(conn, "tool.call", 15000);

    expect(toolCall.kind).toBe("tool.call");
    if (toolCall.kind !== "tool.call") {
      throw new Error("Expected tool.call");
    }

    expect(toolCall.toolId).toBe("get_weather");
    const args = JSON.parse(toolCall.arguments);
    expect(args.location.toLowerCase()).toContain("tokyo");

    // wait for first response to complete before sending tool result
    await waitFor(conn, "response.done", 15000);

    // send tool result
    conn.send({
      kind: "tool.result",
      callId: toolCall.callId,
      result: JSON.stringify({ temperature: 22, condition: "sunny" }),
    });

    // trigger follow-up response
    conn.send({ kind: "response.create" });

    // wait for second response to complete
    await waitFor(conn, "response.done", 15000);

    conn.close();

    // verify we got text mentioning the weather
    const textEvents = events.filter((e) => e.kind === "text.output");
    const allText = textEvents
      .map((e) => (e.kind === "text.output" ? e.text : ""))
      .join(" ")
      .toLowerCase();

    expect(allText).toMatch(/sunny|22|tokyo/i);
  });
});

/**
 * Wait for a specific event kind.
 */
function waitFor(
  conn: RealtimeConnection,
  kind: RealtimeServerEvent["kind"],
  timeout = 10000,
): Promise<RealtimeServerEvent> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      conn.off("event", handler);
      reject(new Error(`timeout waiting for ${kind}`));
    }, timeout);

    const handler = (e: RealtimeServerEvent) => {
      if (e.kind === kind) {
        clearTimeout(timer);
        conn.off("event", handler);
        resolve(e);
      }
    };

    conn.on("event", handler);
  });
}
