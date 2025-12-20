import { randomID } from "@kernl-sdk/shared/lib";

import type { Context, UnknownContext } from "@/context";
import type { Tool, BaseToolkit } from "@/tool";
import { memory } from "@/tool";
import { MisconfiguredError } from "@/lib/error";
import { AgentHooks } from "@/lifecycle";
import type { Kernl } from "@/kernl";
import type {
  AgentMemoryCreate,
  AgentMemoryUpdate,
  MemoryListOptions,
  MemorySearchQuery,
} from "@/memory";

import type { AgentKind, AgentMemoryConfig, AgentOutputType } from "./types";
import type { TextOutput } from "@/thread/types";

/**
 * Base configuration shared by all agent types.
 */
export interface BaseAgentConfig<TContext = UnknownContext> {
  id: string;
  name: string;
  description?: string;
  instructions:
    | string
    | ((context: Context<TContext>) => Promise<string> | string);
  toolkits?: BaseToolkit<TContext>[];
  memory?: AgentMemoryConfig;
}

/**
 * Common model interface shared by all model types.
 */
export interface BaseModel {
  readonly provider: string;
  readonly modelId: string;
}

/**
 * Abstract base class for all agent types.
 *
 * Provides common functionality shared between text-based agents (Agent)
 * and realtime agents (RealtimeAgent).
 */
export abstract class BaseAgent<
  TContext = UnknownContext,
  TOutput extends AgentOutputType = TextOutput,
> extends AgentHooks<TContext, TOutput> {
  protected kernl?: Kernl;

  abstract readonly kind: AgentKind;
  abstract readonly model: BaseModel;

  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly instructions: (
    context: Context<TContext>,
  ) => Promise<string> | string;
  readonly toolkits: BaseToolkit<TContext>[];
  readonly systools: BaseToolkit<TContext>[];
  readonly memory: AgentMemoryConfig;

  constructor(config: BaseAgentConfig<TContext>) {
    super();

    if (config.id.trim() === "") {
      throw new MisconfiguredError("Agent must have an id.");
    }

    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.instructions =
      typeof config.instructions === "function"
        ? config.instructions
        : () => config.instructions as string;
    this.toolkits = config.toolkits ?? [];
    this.systools = [];
    this.memory = config.memory ?? { enabled: false };

    for (const toolkit of this.toolkits) {
      toolkit.bind(this);
    }
  }

  /**
   * Bind this agent to a kernl instance. Called by kernl.register().
   */
  bind(kernl: Kernl): void {
    this.kernl = kernl;

    // initialize system toolkits
    if (this.memory.enabled) {
      // safety: system tools only rely on ctx.agent, not ctx.context
      const toolkit = memory as unknown as BaseToolkit<TContext>;
      this.systools.push(toolkit);
      toolkit.bind(this);
    }
  }

  /**
   * Get a specific tool by ID from systools and toolkits.
   */
  tool(id: string): Tool<TContext> | undefined {
    // check systools first
    for (const toolkit of this.systools) {
      const tool = toolkit.get(id);
      if (tool) return tool;
    }
    // then user toolkits
    for (const toolkit of this.toolkits) {
      const tool = toolkit.get(id);
      if (tool) return tool;
    }
    return undefined;
  }

  /**
   * Get all tools available from systools and toolkits for the given context.
   */
  async tools(context: Context<TContext>): Promise<Tool<TContext>[]> {
    const all: Tool<TContext>[] = [];

    for (const toolkit of [...this.systools, ...this.toolkits]) {
      all.push(...(await toolkit.list(context)));
    }

    const ids = all.map((t) => t.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);

    if (duplicates.length > 0) {
      throw new MisconfiguredError(
        `Duplicate tool IDs found: ${[...new Set(duplicates)].join(", ")}`,
      );
    }

    return all;
  }

  /**
   * Memory management scoped to this agent.
   */
  get memories() {
    if (!this.kernl) {
      throw new MisconfiguredError(
        `Agent ${this.id} not bound to kernl. Call kernl.register(agent) first.`,
      );
    }

    const agentId = this.id;
    const kmem = this.kernl.memories;

    return {
      list: (
        params?: Omit<MemoryListOptions, "filter"> & {
          collection?: string;
          limit?: number;
        },
      ) =>
        kmem.list({
          filter: {
            scope: { agentId },
            collections: params?.collection ? [params.collection] : undefined,
          },
          limit: params?.limit,
        }),

      create: (params: AgentMemoryCreate) =>
        kmem.create({
          id: params.id ?? `mem_${randomID()}`,
          scope: {
            namespace: params.namespace,
            entityId: params.entityId,
            agentId,
          },
          kind: "semantic",
          collection: params.collection,
          content: params.content,
          wmem: params.wmem,
          smem: params.smem,
          timestamp: params.timestamp,
          metadata: params.metadata,
        }),

      update: (params: AgentMemoryUpdate) =>
        kmem.update({
          id: params.id,
          content: params.content,
          collection: params.collection,
          wmem: params.wmem,
          smem: params.smem,
          metadata: params.metadata,
        }),

      search: (
        params: Omit<MemorySearchQuery, "filter"> & {
          filter?: Omit<NonNullable<MemorySearchQuery["filter"]>, "scope"> & {
            scope?: Omit<
              NonNullable<NonNullable<MemorySearchQuery["filter"]>["scope"]>,
              "agentId"
            >;
          };
        },
      ) =>
        kmem.search({
          ...params,
          filter: {
            ...params.filter,
            scope: {
              ...params.filter?.scope,
              agentId,
            },
          },
        }),
    };
  }
}
