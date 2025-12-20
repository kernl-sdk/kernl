import { type ZodType } from "zod";

import {
  LanguageModel,
  LanguageModelRequestSettings,
} from "@kernl-sdk/protocol";

import { Context, UnknownContext } from "@/context";
import { InputGuardrail, OutputGuardrail } from "@/guardrail";
import { BaseToolkit } from "@/tool";

import { TextOutput } from "@/thread/types";

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
   * ```typescript
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
   * Memory configuration for this agent.
   * Enables memory system tools (memories.search, memories.create, memories.list).
   *
   * Requires kernl to be configured with memory storage.
   */
  memory?: AgentMemoryConfig;

  /**
   * A list of checks that run in parallel to the agent's execution on the input + output for the agent,
   * depending on the configuration.
   */
  guardrails?: AgentGuardrails<TOutput>;

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

  /**
   * Whether to reset the tool choice to the default value after a tool has been called. Defaults
   * to `true`. This ensures that the agent doesn't enter an infinite loop of tool usage.
   */
  resetToolChoice?: boolean;
}

/**
 * Guardrails for an agent.
 */
export interface AgentGuardrails<TOutput extends AgentOutputType = TextOutput> {
  /**
   * A list of checks that run in parallel to the agent's execution, before generating a response.
   * Runs only if the agent is the first agent in the chain.
   */
  input: InputGuardrail[];
  /**
   * A list of checks that run on the final output of the agent, after generating a response. Runs
   * only if the agent produces a final output.
   */
  output: OutputGuardrail<TOutput>[];
}

/**
 * The type of the output. If not provided, the output will be a string.
 * 'text' is a special type that indicates the output will be a string.
 */
export type AgentOutputType = TextOutput | ZodType;

/**
 * Memory configuration for an agent.
 */
export interface AgentMemoryConfig {
  /**
   * Enable memory system tools for this agent.
   */
  enabled: boolean;
}

/**
 * Agent kind discriminator.
 */
export type AgentKind = "llm" | "realtime";
