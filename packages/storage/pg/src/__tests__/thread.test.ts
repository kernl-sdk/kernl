import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { Pool } from "pg";

import {
  Agent,
  Kernl,
  tool,
  FunctionToolkit,
  KernlStorage,
} from "kernl";
import { STOPPED, message, IN_PROGRESS } from "@kernl-sdk/protocol";

import { postgres } from "@/postgres";

// Use helper from test fixtures (handles streaming properly)
function createMockModel(generateFn: any): any {
  return {
    spec: "1.0" as const,
    provider: "test",
    modelId: "test-model",
    generate: generateFn,
    stream: async function* (req: any) {
      const response = await generateFn(req);
      for (const item of response.content) {
        yield item;
      }
      yield {
        kind: "finish" as const,
        finishReason: response.finishReason,
        usage: response.usage,
      };
    },
  };
}

const TEST_DB_URL = process.env.KERNL_PG_TEST_URL;

describe.sequential("PG Thread Lifecycle", () => {
  if (!TEST_DB_URL) {
    it.skip("requires KERNL_PG_TEST_URL environment variable", () => {});
    return;
  }

  let pool: Pool;
  let storage: KernlStorage;
  let kernl: Kernl;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });
    storage = postgres({ pool });

    await pool.query('DROP SCHEMA IF EXISTS "kernl" CASCADE');
    await storage.init();

    kernl = new Kernl({ storage: { db: storage } });
  });

  afterAll(async () => {
    await storage.close();
  });

  beforeEach(async () => {
    // Clean threads between tests
    await pool.query(
      'TRUNCATE "kernl"."threads", "kernl"."thread_events" CASCADE',
    );
  });

  describe("Simple thread (no tools)", () => {
    it("should persist thread record and events correctly", async () => {
      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Hello, world!" })],
        finishReason: "stop",
        usage: { inputTokens: 5, outputTokens: 3, totalTokens: 8 },
        warnings: [],
      }));

      const agent = new Agent({
        id: "simple-agent",
        name: "Simple",
        instructions: "Test",
        model,
      });

      kernl.register(agent);

      const result = await agent.run("Hello");

      expect(result.response).toBe("Hello, world!");

      // Verify thread record
      const threadResult = await pool.query(
        'SELECT * FROM "kernl"."threads" WHERE agent_id = $1',
        ["simple-agent"],
      );

      expect(threadResult.rows).toHaveLength(1);
      const thread = threadResult.rows[0];

      expect(thread.agent_id).toBe("simple-agent");
      expect(thread.state).toBe(STOPPED);
      expect(thread.tick).toBe(1);
      expect(thread.model).toMatch(/test/);

      // Verify events
      const eventsResult = await pool.query(
        'SELECT * FROM "kernl"."thread_events" WHERE tid = $1 ORDER BY seq ASC',
        [thread.id],
      );

      expect(eventsResult.rows.length).toBeGreaterThanOrEqual(2);

      // User message
      expect(eventsResult.rows[0].kind).toBe("message");
      expect(eventsResult.rows[0].seq).toBe(0);

      // Assistant message
      expect(eventsResult.rows[1].kind).toBe("message");
      expect(eventsResult.rows[1].seq).toBe(1);

      // Verify monotonic seq
      const seqs = eventsResult.rows.map((r) => r.seq);
      expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
      expect(new Set(seqs).size).toBe(seqs.length);
    });
  });

  describe("Multi-turn with tools", () => {
    it("should persist all events across ticks with correct seq", async () => {
      let callCount = 0;
      const model = createMockModel(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            content: [
              message({ role: "assistant", text: "" }),
              {
                kind: "tool-call",
                toolId: "add",
                callId: "call_1",
                state: IN_PROGRESS,
                arguments: '{"a":2,"b":3}',
              },
            ],
            finishReason: "stop",
            usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
            warnings: [],
          };
        }
        return {
          content: [message({ role: "assistant", text: "The sum is 5" })],
          finishReason: "stop",
          usage: { inputTokens: 15, outputTokens: 5, totalTokens: 20 },
          warnings: [],
        };
      });

      const addTool = tool({
        id: "add",
        description: "Add numbers",
        parameters: undefined, // No validation for test
        execute: async (ctx, params: any) => {
          const { a, b } = params;
          return a + b;
        },
      });

      const agent = new Agent({
        id: "tool-agent",
        name: "Tool Agent",
        instructions: "Test",
        model,
        toolkits: [new FunctionToolkit({ id: "math", tools: [addTool] })],
      });

      kernl.register(agent);

      await agent.run("Add 2 and 3");

      // verify thread
      const threadResult = await pool.query(
        'SELECT * FROM "kernl"."threads" WHERE agent_id = $1',
        ["tool-agent"],
      );

      expect(threadResult.rows).toHaveLength(1);
      expect(threadResult.rows[0].tick).toBe(2); // 2 ticks
      expect(threadResult.rows[0].state).toBe(STOPPED);

      // verify events
      const eventsResult = await pool.query(
        'SELECT * FROM "kernl"."thread_events" WHERE tid = $1 ORDER BY seq ASC',
        [threadResult.rows[0].id],
      );

      const events = eventsResult.rows;

      // Should have: user msg, assistant msg (tick1), tool-call, tool-result, assistant msg (tick2)
      expect(events.length).toBeGreaterThanOrEqual(5);

      // Verify event kinds and order
      expect(events[0].kind).toBe("message"); // user
      expect(events[1].kind).toBe("message"); // assistant (tick 1)
      expect(events[2].kind).toBe("tool-call");
      expect(events[3].kind).toBe("tool-result");
      expect(events[4].kind).toBe("message"); // assistant (tick 2)

      // Verify tool result exists and is in correct format
      const toolResult = events[3];
      expect(toolResult.data.state).toBe("completed");
      expect(toolResult.data.callId).toBe("call_1");
      expect(toolResult.data.toolId).toBe("add");

      // Verify seq is monotonic
      const seqs = events.map((e) => e.seq);
      expect(seqs).toEqual([0, 1, 2, 3, 4]);
    });
  });

  describe("Resume from storage", () => {
    it("should load thread from storage and append new events", async () => {
      const model = createMockModel(async () => ({
        content: [message({ role: "assistant", text: "Response" })],
        finishReason: "stop",
        usage: { inputTokens: 5, outputTokens: 3, totalTokens: 8 },
        warnings: [],
      }));

      const agent = new Agent({
        id: "resume-agent",
        name: "Resume",
        instructions: "Test",
        model,
      });

      kernl.register(agent);

      const threadId = "resume-test-123";

      // First run
      await agent.run("First message", { threadId });

      const firstEventsResult = await pool.query(
        'SELECT COUNT(*) as count FROM "kernl"."thread_events" WHERE tid = $1',
        [threadId],
      );

      const firstEventCount = parseInt(firstEventsResult.rows[0].count);
      expect(firstEventCount).toBeGreaterThanOrEqual(2);

      // Second run: resume
      await agent.run("Second message", { threadId });

      const secondEventsResult = await pool.query(
        'SELECT * FROM "kernl"."thread_events" WHERE tid = $1 ORDER BY seq ASC',
        [threadId],
      );

      const secondEventCount = secondEventsResult.rows.length;

      // Should have more events now
      expect(secondEventCount).toBeGreaterThan(firstEventCount);

      // Verify seq is still monotonic across both runs
      const seqs = secondEventsResult.rows.map((r) => r.seq);
      expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
      expect(new Set(seqs).size).toBe(seqs.length);

      // Verify last events are from second run
      const lastEvents = secondEventsResult.rows.slice(-2);
      expect(lastEvents[0].kind).toBe("message"); // user: "Second message"
      expect(lastEvents[1].kind).toBe("message"); // assistant response
    });
  });

  describe("Error handling", () => {
    it.skip("should rollback on persist failure", async () => {
      // TODO: Implement once we have transaction-level control in storage
      // This would require forcing a DB error mid-transaction
      // Expected behavior:
      // - If append() fails, no partial events should be written
      // - Thread state should remain consistent
    });
  });
});
