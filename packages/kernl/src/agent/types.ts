import { z, type ZodType } from "zod";

import {
  LanguageModel,
  LanguageModelRequestSettings,
} from "@kernl-sdk/protocol";

import { Context, UnknownContext } from "@/context";
import { BaseToolkit } from "@/tool";
import type { MemorySnapshot } from "@/memory";
import type { Pipe } from "@/thread/pipe";

import { TextOutput } from "@/thread/types";

/**
 * Resolves the agent output type based on the response type.
 * - If TOutput is "text" → output is string
 * - If TOutput is a ZodType → output is the inferred type from that schema
 */
export type ResolvedAgentResponse<TOutput extends AgentOutputType> =
  TOutput extends TextOutput
    ? string
    : TOutput extends ZodType
      ? z.infer<TOutput>
      : never;

/**
 * Configuration for an agent.
 */
export interface AgentConfig<
  TContext = UnknownContext,
  TOutput extends AgentOutputType = TextOutput,
> {
  id: string /* The unique identifier for the agent */;
  name: string /* The name of the agent (defaults to ID if not provided) */;
  description?: string /* A brief description of the agent's purpose */;

  /**
   * The instructions for the agent. Will be used as the "system prompt" when this agent is
   * invoked. Describes what the agent should do, and how it responds.
   *
   * Can either be a string, or a function that dynamically generates instructions for the agent.
   * If you provide a function, it will be called with the context and the agent instance. It
   * must return a string.
   */
  instructions:
    | string
    | ((context: Context<TContext>) => Promise<string> | string);

  // /**
  //  * Handoffs are sub-agents that the agent can delegate to. You can provide a list of handoffs,
  //  * and the agent can choose to delegate to them if relevant. Allows for separation of concerns
  //  * and modularity.
  //  */
  // handoffs: (Agent<any, any> | Handoff<any, TResponse>)[];

  /**
   * The model implementation to use when invoking the LLM.
   *
   * By default, if not set, the agent will use a default model that throws an error when called.
   */
  model: LanguageModel;

  /**
   * Configures model-specific tuning parameters (e.g. temperature, top_p, etc.)
   */
  modelSettings?: LanguageModelRequestSettings;

  /**
   * The type of the output that the agent will return.
   *
   * Can be either:
   * - `"text"` (default): The agent returns a plain string response
   * - A Zod schema: The agent returns structured output validated against the schema
   *
   * When a Zod schema is provided, the output is converted to JSON Schema and sent to the
   * model for native structured output support. The response is then validated against
   * the Zod schema as a safety net.
   */
  output?: TOutput;

  /**
   * A list of toolkits the agent can use. Toolkits are collections of related tools
   * that can be static (Toolkit) or dynamic (MCPToolkit).
   *
   * @example
   * ```ts
   * const myTools = new Toolkit({
   *   id: "custom",
   *   tools: [tool1, tool2]
   * });
   *
   * const github = new MCPToolkit({
   *   id: "github",
   *   server: githubServer
   * });
   *
   * const agent = new Agent({
   *   name: "Assistant",
   *   instructions: "...",
   *   toolkits: [myTools, github]
   * });
   * ```
   */
  toolkits?: BaseToolkit<TContext>[];

  /**
   * Memory configuration for working memory injection.
   *
   * @example
   * ```ts
   * const agent = new Agent({
   *   memory: {
   *     load: async (ctx) => {
   *       const facts = await fetchUserFacts(ctx.context.userId);
   *       return facts.map(f => `- ${f}`).join('\n');
   *     },
   *   },
   * });
   * ```
   */
  memory?: AgentMemoryConfig<TContext>;

  /**
   * Input/output processors for the agent.
   *
   * @example
   * ```ts
   * const agent = new Agent({
   *   processors: {
   *     pre: pipe.filter(item => item.kind !== "delta").truncate(4000),
   *     post: pipe.redact(['PII']).guardrail(myGuardrail),
   *   },
   * });
   * ```
   */
  processors?: {
    pre?: Pipe;
    post?: Pipe;
  };

  // /**
  //  * (TODO): Not sure if this is really necessary.. need to see use case examples
  //  *
  //  * This lets you configure how tool use is handled.
  //  * - `run_llm_again`: The default behavior. Tools are run, and then the LLM receives the results
  //  *   and gets to respond.
  //  * - `stop_on_first_tool`: The output of the first tool call is used as the final output. This means
  //  *   that the LLM does not process the result of the tool call.
  //  * - A list of tool names: The agent will stop running if any of the tools in the list are called.
  //  *   The final output will be the output of the first matching tool call. The LLM does not process
  //  *   the result of the tool call.
  //  * - A function: if you pass a function, it will be called with the run context and the list of
  //  *   tool results. It must return a `ToolsToFinalOutputResult`, which determines whether the tool
  //  *   call resulted in a final output.
  //  *
  //  * NOTE: This configuration is specific to `FunctionTools`. Hosted tools, such as file search, web
  //  * search, etc. are always processed by the LLM
  //  */
  // toolUseBehavior: ToolUseBehavior;
}

/**
 * The type of the output. If not provided, the output will be a string.
 * 'text' is a special type that indicates the output will be a string.
 */
export type AgentOutputType = TextOutput | ZodType;

/**
 * Agent kind discriminator.
 */
export type AgentKind = "llm" | "realtime";

/**
 * Memory configuration for an agent.
 */
export interface AgentMemoryConfig<TContext = UnknownContext> {
  /**
   * Load working memory snapshot to inject into the agent's context window.
   *
   * Called before each model request. Return a string or Renderable
   * that will be wrapped in `<working_memory>` tags.
   */
  load?: (
    context: Context<TContext>,
  ) => Promise<MemorySnapshot> | MemorySnapshot;
}
