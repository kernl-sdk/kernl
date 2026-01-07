import type { LanguageModel } from "@kernl-sdk/protocol";
import { resolveEmbeddingModel } from "@kernl-sdk/retrieval";

import { Agent } from "@/agent";
import { BaseAgent } from "@/agent/base";
import { Context, UnknownContext } from "@/context";
import { KernlHooks } from "@/lifecycle";
import type { Thread } from "@/thread";
import type { ResolvedAgentResponse } from "@/guardrail";
import { InMemoryStorage, type KernlStorage } from "@/storage";
import { RThreads } from "@/api/resources/threads";
import { RAgents } from "@/api/resources/agents";
import {
  Memory,
  MemoryByteEncoder,
  MemoryIndexHandle,
  buildMemoryIndexSchema,
} from "@/memory";
import { FunctionToolkit } from "@/tool";
import { extractHandoff, MaxHandoffsExceededError } from "@/handoff";
import type { HandoffRecord, HandoffRunResult, HandoffResult } from "@/handoff";
import { tool } from "@/tool";
import { z } from "zod";

import { logger } from "@/lib/logger";

import type { ThreadExecuteResult, ThreadStreamEvent } from "@/thread/types";
import type { AgentOutputType } from "@/agent/types";
import type {
  KernlOptions,
  KernlRunOptions,
  MemoryOptions,
  StorageOptions,
} from "./types";

/**
 * The kernl - manages agent processes, scheduling, and task lifecycle.
 *
 * Orchestrates agent execution, including guardrails, tool calls, session persistence, and
 * tracing.
 */
export class Kernl extends KernlHooks<UnknownContext, AgentOutputType> {
  private readonly _agents: Map<string, BaseAgent> = new Map();
  private readonly _models: Map<string, LanguageModel> = new Map();

  readonly storage: KernlStorage;
  athreads: Map<string, Thread<any, any>> = new Map(); /* active threads */

  private readonly _memopts: MemoryOptions | undefined;
  private readonly _storopts: StorageOptions | undefined;

  private warnings = {
    embedding: false, // "Embeddings are not configured. If you want memories to auto-embed text content..."
    vector: false, // "No vector storage configured. The memories.search() function will not be..."
  }; /* tracks warnings that have been logged */

  // --- public API ---
  readonly threads: RThreads;
  readonly agents: RAgents;
  readonly memories: Memory;

  constructor(options: KernlOptions = {}) {
    super();

    this._memopts = options.memory;
    this._storopts = options.storage;

    this.storage = options.storage?.db ?? new InMemoryStorage();
    this.storage.bind({ agents: this._agents, models: this._models });
    this.threads = new RThreads(this.storage.threads);
    this.agents = new RAgents(this._agents);
    this.memories = this.initializeMemory();
  }

  /**
   * Registers one or more agents with the kernl instance.
   */
  register(...agents: BaseAgent[]): void {
    for (const agent of agents) {
      this._agents.set(agent.id, agent);
      agent.bind(this);

      // memory config warnings (log once)
      if (agent.memory.enabled) {
        if (!this._memopts?.embedding && !this.warnings.embedding) {
          logger.warn(
            "Embeddings are not configured. If you want memories to auto-embed text content, " +
              "pass an embedding model into the memory config in new Kernl()",
          );
          this.warnings.embedding = true;
        }

        if (!this._storopts?.vector && !this.warnings.vector) {
          logger.warn(
            "No vector storage configured. The memories.search() function will not be " +
              "available. To enable memory search, pass storage.vector in new Kernl()",
          );
          this.warnings.vector = true;
        }
      }

      // auto-populate model registry for storage hydration (llm agents only - for now)
      if (agent.kind === "llm") {
        const key = `${agent.model.provider}/${agent.model.modelId}`;
        if (!this._models.has(key)) {
          this._models.set(key, agent.model as LanguageModel);
        }
      }
    }
  }

  /**
   * Spawn a new thread - blocking execution
   */
  async spawn<TContext, TOutput extends AgentOutputType>(
    thread: Thread<TContext, TOutput>,
  ): Promise<ThreadExecuteResult<ResolvedAgentResponse<TOutput>>> {
    this.athreads.set(thread.tid, thread);
    try {
      return await thread.execute();
    } finally {
      this.athreads.delete(thread.tid);
    }
  }

  /**
   * Schedule an existing thread - blocking execution
   *
   * NOTE: just blocks for now
   */
  async schedule<TContext, TOutput extends AgentOutputType>(
    thread: Thread<TContext, TOutput>,
  ): Promise<ThreadExecuteResult<ResolvedAgentResponse<TOutput>>> {
    this.athreads.set(thread.tid, thread);
    try {
      return await thread.execute();
    } finally {
      this.athreads.delete(thread.tid);
    }
  }

  /**
   * (TMP) - won't make sense in async scheduling contexts
   *
   * Spawn a new thread - streaming execution
   */
  async *spawnStream<TContext, TOutput extends AgentOutputType>(
    thread: Thread<TContext, TOutput>,
  ): AsyncIterable<ThreadStreamEvent> {
    this.athreads.set(thread.tid, thread);
    try {
      yield* thread.stream();
    } finally {
      this.athreads.delete(thread.tid);
    }
  }

  /**
   * (TMP) - won't make sense with async scheduling contexts
   *
   * Schedule an existing thread - streaming execution
   */
  async *scheduleStream<TContext, TOutput extends AgentOutputType>(
    thread: Thread<TContext, TOutput>,
  ): AsyncIterable<ThreadStreamEvent> {
    this.athreads.set(thread.tid, thread);
    try {
      yield* thread.stream();
    } finally {
      this.athreads.delete(thread.tid);
    }
  }

  /**
   * Run an agent with optional handoff support between registered agents.
   *
   * When multiple agents are registered, a handoff tool is automatically injected
   * that allows agents to transfer execution to other agents. The run loop continues
   * until an agent produces a final response (no handoff) or the maxHandoffs limit
   * is exceeded.
   *
   * @param agentId - The ID of the agent to start with
   * @param input - The input to pass to the agent
   * @param options - Optional configuration including maxHandoffs limit
   * @returns HandoffRunResult with output, finalAgent, and handoffChain
   */
  async run(
    agentId: string,
    input: string,
    options: KernlRunOptions = {},
  ): Promise<HandoffRunResult> {
    const maxHandoffs = options.maxHandoffs ?? 10;
    const handoffChain: HandoffRecord[] = [];

    let currentAgentId = agentId;
    let currentInput = input;

    for (;;) {
      // Get the current agent
      const agent = this._agents.get(currentAgentId);
      if (!agent) {
        throw new Error(`Agent "${currentAgentId}" not found`);
      }

      // Only support LLM agents for now
      if (agent.kind !== "llm") {
        throw new Error(`Agent "${currentAgentId}" is not an LLM agent`);
      }

      const llmAgent = agent as Agent;

      // Get list of other agent IDs for handoff
      const otherAgentIds = Array.from(this._agents.keys()).filter(
        (id) => id !== currentAgentId,
      );

      // Create context for this run
      const context = new Context<UnknownContext>("kernl");
      context.agent = llmAgent;

      // Track handoff via a capturing wrapper
      let capturedHandoff: HandoffResult | null = null;

      // Create handoff toolkit if there are other agents
      let handoffToolkit: FunctionToolkit | null = null;
      if (otherAgentIds.length > 0) {
        // Create a capturing handoff tool that stores the result
        const capturingHandoffTool = this.createCapturingHandoffTool(
          currentAgentId,
          otherAgentIds,
          (handoff) => {
            capturedHandoff = handoff;
          },
        );
        handoffToolkit = new FunctionToolkit({
          id: "__handoff__",
          description: "Internal handoff toolkit",
          tools: [capturingHandoffTool],
        });
        handoffToolkit.bind(llmAgent);
        llmAgent.toolkits.push(handoffToolkit);
      }

      try {
        // Run the agent
        const result = await llmAgent.run(currentInput);

        // Check for handoff - from captured tool result or response
        const handoff = capturedHandoff ?? extractHandoff(result.response);

        if (handoff) {
          // Check handoff limit
          if (handoffChain.length >= maxHandoffs) {
            throw new MaxHandoffsExceededError(maxHandoffs, handoffChain);
          }

          // Record the handoff
          const record: HandoffRecord = {
            from: handoff.from,
            to: handoff.to,
            message: handoff.message,
            timestamp: new Date(),
          };
          handoffChain.push(record);

          // Emit agent_handoff event
          this.emit("agent_handoff", context, llmAgent, handoff);

          // Switch to target agent
          currentAgentId = handoff.to;
          currentInput = handoff.message;
        } else {
          // No handoff - return final result
          const output =
            typeof result.response === "string"
              ? result.response
              : String(result.response);

          return {
            output,
            finalAgent: currentAgentId,
            handoffChain,
          };
        }
      } finally {
        // Clean up toolkit
        if (handoffToolkit) {
          const idx = llmAgent.toolkits.indexOf(handoffToolkit);
          if (idx !== -1) {
            llmAgent.toolkits.splice(idx, 1);
          }
        }
      }
    }
  }

  /**
   * Creates a handoff tool that captures the result when executed.
   */
  private createCapturingHandoffTool(
    agentId: string,
    availableAgents: string[],
    onHandoff: (handoff: HandoffResult) => void,
  ) {
    const description =
      availableAgents.length > 0
        ? `Transfer execution to another agent. Available agents: ${availableAgents.join(", ")}`
        : "Transfer execution to another agent (no other agents currently available)";

    const toSchema =
      availableAgents.length > 0
        ? z.enum(availableAgents as [string, ...string[]])
        : z.string();

    return tool({
      id: "handoff",
      description,
      parameters: z.object({
        to: toSchema.describe("The ID of the agent to hand off to"),
        message: z
          .string()
          .describe("Context and instructions for the target agent"),
      }),
      execute: async (
        _ctx: any,
        params: { to: string; message: string },
      ): Promise<HandoffResult> => {
        const result: HandoffResult = {
          kind: "handoff",
          to: params.to,
          message: params.message,
          from: agentId,
        };
        onHandoff(result);
        return result;
      },
    });
  }

  // --- private utils ---

  /**
   * @internal
   *
   * Initialize the memory system based on the storage + memory configuration.
   */
  private initializeMemory(): Memory {
    const embeddingModel = this._memopts?.embedding;
    const embedder = embeddingModel
      ? typeof embeddingModel === "string"
        ? resolveEmbeddingModel<string>(embeddingModel)
        : embeddingModel
      : undefined;
    const encoder = new MemoryByteEncoder(embedder);

    const vector = this._storopts?.vector;
    const indexId = this._memopts?.indexId ?? "memories_sindex";
    const dimensions = this._memopts?.dimensions ?? 1536;
    const providerOptions = this._memopts?.indexProviderOptions ?? {
      schema: "kernl",
    };

    return new Memory({
      store: this.storage.memories,
      search: vector
        ? new MemoryIndexHandle({
            index: vector,
            indexId,
            schema: buildMemoryIndexSchema({ dimensions }),
            providerOptions,
          })
        : undefined,
      encoder,
    });
  }
}
