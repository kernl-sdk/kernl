import {
  message,
  LanguageModel,
  LanguageModelItem,
  LanguageModelRequestSettings,
} from "@kernl-sdk/protocol";

import type { Context, UnknownContext } from "./context";
import { InputGuardrail, OutputGuardrail } from "./guardrail";
import { AgentHooks } from "./lifecycle";
import { BaseToolkit } from "./tool/toolkit";
import { Tool } from "./tool";
import { Thread } from "./thread";

import { MisconfiguredError } from "./lib/error";

import type { Kernl } from "./kernl";
import type { AgentConfig, AgentResponseType } from "./types/agent";
import type { ResolvedAgentResponse } from "./guardrail";
import type {
  TextResponse,
  ThreadOptions,
  ThreadExecuteResult,
  ThreadStreamEvent,
} from "./types/thread";

export class Agent<
    TContext = UnknownContext,
    TResponse extends AgentResponseType = TextResponse,
  >
  extends AgentHooks<TContext, TResponse>
  implements AgentConfig<TContext, TResponse>
{
  private kernl?: Kernl;

  id: string;
  name: string;
  instructions: (context: Context<TContext>) => Promise<string> | string;

  model: LanguageModel;
  modelSettings: LanguageModelRequestSettings;
  toolkits: BaseToolkit<TContext>[];
  // actions: ActionSet; /* TODO */

  guardrails: {
    input: InputGuardrail[];
    output: OutputGuardrail<AgentResponseType>[];
  };
  responseType: TResponse = "text" as TResponse;
  resetToolChoice: boolean;
  // toolUseBehavior: ToolUseBehavior; (TODO)

  // --- (TODO) ---
  // handoffDescription: string; // ??
  // handoffs: (Agent<any, TResponse> | Handoff<any, TResponse>)[];
  // ----------

  // /* Process/thread-group–wide signal state shared by all threads in the group: shared pending signals, job control
  // (stops/cont, group exit), rlimits, etc. */
  // signal: *struct signal_struct;
  //
  //  /* Table of signal handlers (sa_handler, sa_mask, flags) shared by threads
  // (CLONE_SIGHAND). RCU-protected so readers can access it locklessly. */
  // sighand: *struct sighand_struct __rcu;

  constructor(config: AgentConfig<TContext, TResponse>) {
    super();
    if (config.id.trim() === "") {
      throw new MisconfiguredError("Agent must have an id.");
    }
    this.id = config.id;
    this.name = config.name;
    this.instructions =
      typeof config.instructions === "function"
        ? config.instructions
        : () => config.instructions as string;
    this.model = config.model; // (TODO): include optional default setting for convenience like env.DEFAULT_LLM = "gpt-5"
    this.modelSettings = config.modelSettings ?? {};

    this.toolkits = config.toolkits ?? [];
    for (const toolkit of this.toolkits) {
      toolkit.bind(this);
    }

    this.guardrails = config.guardrails ?? { input: [], output: [] };
    if (config.responseType) {
      this.responseType = config.responseType;
    }
    this.resetToolChoice = config.resetToolChoice ?? true;
    // this.toolUseBehavior = config.toolUseBehavior ?? "run_llm_again";

    // this.handoffDescription = config.handoffDescription ?? "";
    // this.handoffs = config.handoffs ?? [];

    // --- Runtime warning for handoff response type compatibility ---
    // if (config.handoffresponseTypeWarningEnabled) {
    //     ...
    //     if (responseTypes.size > 1) {
    //       logger.warn(
    //         `[Agent] Warning: Handoff agents have different response types: ${Array.from(responseTypes).join(", ")}.
    //          You can make it type-safe by using Agent.create({ ... }) method instead.`,
    //       );
    //     }
    //   }
    // }
  }

  /**
   * Bind this agent to a kernl instance. Called by kernl.register().
   */
  bind(kernl: Kernl): void {
    this.kernl = kernl;
  }

  /**
   * Blocking execution - spawns or resumes thread and waits for completion
   */
  async run(
    input: string | LanguageModelItem[],
    options?: ThreadOptions<TContext>,
  ): Promise<ThreadExecuteResult<ResolvedAgentResponse<TResponse>>> {
    if (!this.kernl) {
      throw new MisconfiguredError(
        `Agent ${this.id} not bound to kernl. Call kernl.register(agent) first.`,
      );
    }

    const items = typeof input === "string"
      ? [message({ role: "user", text: input })]
      : input;
    const tid = options?.threadId;

    // NOTE: may end up moving this to the kernl
    let thread = tid ? this.kernl.threads.get(tid) : null;
    if (!thread) {
      thread = new Thread(this.kernl, this, items, options);
      return this.kernl.spawn(thread);
    }

    items.forEach((item) => thread!.append(item));
    return this.kernl.schedule(thread);
  }

  /**
   * Streaming execution - spawns or resumes thread and returns async iterator
   *
   * NOTE: streaming probably won't make sense in scheduling contexts so spawnStream etc. won't make sense
   */
  async *stream(
    input: string | LanguageModelItem[],
    options?: ThreadOptions<TContext>,
  ): AsyncIterable<ThreadStreamEvent> {
    if (!this.kernl) {
      throw new MisconfiguredError(
        `Agent ${this.id} not bound to kernl. Call kernl.register(agent) first.`,
      );
    }

    const items = typeof input === "string"
      ? [message({ role: "user", text: input })]
      : input;
    const tid = options?.threadId;

    // NOTE: may end up moving this to the kernl
    let thread = tid ? this.kernl.threads.get(tid) : null;
    if (!thread) {
      thread = new Thread(this.kernl, this, items, options);
      yield* this.kernl.spawnStream(thread);
      return;
    }

    items.forEach((item) => thread!.append(item));
    yield* this.kernl.scheduleStream(thread);
  }

  /**
   * Get a specific tool by ID from all toolkits.
   *
   * @param id The tool ID to look up
   * @returns The tool if found, undefined otherwise
   */
  tool(id: string): Tool<TContext> | undefined {
    for (const toolkit of this.toolkits) {
      const tool = toolkit.get(id);
      if (tool) return tool;
    }
    return undefined;
  }

  /**
   * Get all tools available from all toolkits for the given context.
   * Checks for duplicate tool IDs across toolkits and throws an error if found.
   *
   * (TODO): Consider returning toolkits alongside tools so we can serialize them
   * together and give agents more options for dealing with tool groups.
   *
   * @param context The context to use for filtering tools
   * @returns Array of all available tools
   * @throws {MisconfiguredError} If duplicate tool IDs are found across toolkits
   */
  async tools(context: Context<TContext>): Promise<Tool<TContext>[]> {
    const allTools: Tool<TContext>[] = [];
    const toolIds = new Set<string>();

    for (const toolkit of this.toolkits) {
      const tools = await toolkit.list(context);

      const duplicates = tools.map((t) => t.id).filter((id) => toolIds.has(id));
      if (duplicates.length > 0) {
        throw new MisconfiguredError(
          `Duplicate tool IDs found across toolkits: ${duplicates.join(", ")}`,
        );
      }

      tools.forEach((t) => toolIds.add(t.id));
      allTools.push(...tools);
    }

    return allTools;
  }
}
