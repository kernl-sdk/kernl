import { describe, it, expect } from "vitest";

import { Thread } from "../thread";
import { Agent } from "@/agent";
import { Kernl } from "@/kernl";
import { Context } from "@/context";
import { InMemoryStorage } from "@/storage/in-memory";
import { createMockModel } from "./fixtures/mock-model";
import type { LanguageModelRequest, LanguageModelItem } from "@kernl-sdk/protocol";

// Helper to create user message input
function userMessage(text: string): LanguageModelItem[] {
  return [
    {
      kind: "message" as const,
      id: "msg-test",
      role: "user" as const,
      content: [{ kind: "text" as const, text }],
    },
  ];
}

describe("Thread Namespaces", () => {
  it("should use 'kernl' namespace by default", () => {
    const model = createMockModel(async () => ({
      content: [],
      finishReason: "stop",
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      warnings: [],
    }));

    const agent = new Agent({
      id: "test",
      name: "Test",
      instructions: "Test agent",
      model,
    });

    const thread = new Thread({ agent });

    expect(thread.namespace).toBe("kernl");
    expect(thread.context.namespace).toBe("kernl");
  });

  it("should accept custom namespace in constructor", () => {
    const model = createMockModel(async () => ({
      content: [],
      finishReason: "stop",
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      warnings: [],
    }));

    const agent = new Agent({
      id: "test",
      name: "Test",
      instructions: "Test agent",
      model,
    });

    const thread = new Thread({
      agent,
      namespace: "tenant-123",
    });

    expect(thread.namespace).toBe("tenant-123");
    expect(thread.context.namespace).toBe("tenant-123");
  });

  it("should propagate namespace from agent.run() options", async () => {
    const model = createMockModel(async (req: LanguageModelRequest) => {
      return {
        content: [
          {
            kind: "message" as const,
            id: "msg_1",
            role: "assistant" as const,
            content: [{ kind: "text" as const, text: "Hello" }],
          },
        ],
        finishReason: "stop",
        usage: { inputTokens: 2, outputTokens: 2, totalTokens: 4 },
        warnings: [],
      };
    });

    const agent = new Agent({
      id: "test",
      name: "Test",
      instructions: "Test agent",
      model,
    });

    // Mock storage to intercept the thread creation
    const storage = new InMemoryStorage();
    const kernl = new Kernl({ storage: { db: storage } });
    kernl.register(agent);

    const result = await agent.run("Hello", {
      namespace: "custom-ns",
    });

    // Verify storage persistence
    const threads = await storage.threads.list();
    const persistedThread = threads[0];
    
    expect(persistedThread).toBeDefined();
    expect(persistedThread.namespace).toBe("custom-ns");
    expect(persistedThread.context.namespace).toBe("custom-ns");
  });

  it("should filter threads by namespace in storage", async () => {
    const model = createMockModel(async () => ({
      content: [
        {
          kind: "message" as const,
          id: "msg_ok",
          role: "assistant" as const,
          content: [{ kind: "text" as const, text: "ok" }],
        },
      ],
      finishReason: "stop",
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      warnings: [],
    }));

    const agent = new Agent({
      id: "test",
      name: "Test",
      instructions: "Test agent",
      model,
    });

    const storage = new InMemoryStorage();
    const kernl = new Kernl({ storage: { db: storage } });
    kernl.register(agent);

    // Create threads in different namespaces
    await agent.run("Thread 1", { namespace: "ns-a" });
    await agent.run("Thread 2", { namespace: "ns-b" });
    await agent.run("Thread 3", { namespace: "ns-a" });

    // Verify filtering
    const nsAThreads = await storage.threads.list({
      filter: { namespace: "ns-a" },
    });
    
    expect(nsAThreads).toHaveLength(2);
    expect(nsAThreads.every(t => t.namespace === "ns-a")).toBe(true);

    const nsBThreads = await storage.threads.list({
      filter: { namespace: "ns-b" },
    });

    expect(nsBThreads).toHaveLength(1);
    expect(nsBThreads[0].namespace).toBe("ns-b");
  });
});

