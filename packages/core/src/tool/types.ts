import { z, type ZodType } from "zod";

import { Agent } from "@/agent";
import { Context, UnknownContext } from "@/context";
import type { ToolStatus } from "@/types/thread";

import type { FunctionTool, HostedTool } from "./tool";

/**
 * A tool that can be called by the model.
 * @template TContext The context passed to the tool
 */
export type Tool<TContext = UnknownContext> =
  | FunctionTool<TContext, any, any>
  | HostedTool;

/**
 * Configuration options for creating a tool.
 *
 * @param TContext The context of the tool
 * @param TParameters The parameters of the tool
 * @param TResult The result type of the tool
 */
export type ToolConfig<
  TContext = UnknownContext,
  TParameters extends ToolInputParameters = undefined,
  TResult = unknown,
> = {
  /**
   * Unique identifier for the tool (required)
   */
  id: string;

  /**
   * Optional friendly name for the tool
   */
  name?: string;

  /**
   * The description of the tool that helps the model understand when to use it.
   */
  description: string;

  /**
   * A Zod object schema describing the tool parameters, or undefined for string input.
   */
  parameters: TParameters;

  /**
   * Execution mode - 'blocking' waits for completion, 'async' lets the agent continue to execute while executing.
   * Defaults to 'blocking'.
   */
  mode?: "blocking" | "async";

  /**
   * The function to invoke when the tool is called.
   */
  execute: ToolExecuteFunction<TContext, TParameters, TResult>;

  /**
   * The function to invoke when an error occurs while running the tool.
   */
  errorfn?: ToolErrorFunction | null;

  /**
   * Whether the tool requires human approval before it can be called.
   */
  requiresApproval?: boolean | ToolApprovalFunction<TParameters>;

  /**
   * Determines whether the tool should be exposed to the model for the current run.
   */
  isEnabled?: ToolEnabledOption<TContext>;
};

/**
 * Type of tool
 */
export type ToolType = "function" | "hosted-tool";

/**
 * The result of invoking a function tool. Either the actual output of the execution or a tool
 * approval request.
 *
 * These get passed for example to the `toolUseBehavior` option of the `Agent` constructor.
 */
export type ToolResult<TResult = unknown> = {
  status: ToolStatus;
  /**
   * The result of the tool call.
   */
  result: TResult | undefined;
  /**
   * Error message if status is "error"
   */
  error: string | null;
};

/**
 * The parameters of a tool.
 * Either undefined (tool takes string input) or a Zod schema.
 */
export type ToolInputParameters = ZodType | undefined;

/**
 * The arguments to a tool - inferred from the Zod schema or string.
 */
export type ToolExecuteArgument<TParameters extends ToolInputParameters> =
  TParameters extends ZodType ? z.infer<TParameters> : string;

/**
 * The function to invoke when the tool is called.
 *
 * @param context An instance of the current RunContext
 * @param params The arguments to the tool (see ToolExecuteArgument)
 */
export type ToolExecuteFunction<
  TContext = UnknownContext,
  TParameters extends ToolInputParameters = undefined,
  TResult = unknown,
> = (
  context: Context<TContext>,
  params: ToolExecuteArgument<TParameters>,
) => Promise<TResult> | TResult;

/**
 * A function that determines if a tool call should be approved.
 *
 * @param context The current execution context
 * @param input The input to the tool
 * @param callId The ID of the tool call
 * @returns True if the tool call should be approved, false otherwise
 */
export type ToolApprovalFunction<TParameters extends ToolInputParameters> = (
  context: Context,
  input: ToolExecuteArgument<TParameters>,
  callId?: string,
) => Promise<boolean>;

export type ToolEnabledFunction<TContext = UnknownContext> = (
  context: Context<TContext>,
  agent: Agent<any, any>, // (TODO): why would we need to take an agent here?
) => Promise<boolean>;

export type ToolEnabledPredicate<TContext = UnknownContext> = (args: {
  context: Context<TContext>;
  agent: Agent<any, any>; // (TODO): why take an agent here? other options?
}) => boolean | Promise<boolean>;

type ToolEnabledOption<Context = UnknownContext> =
  | boolean
  | ToolEnabledPredicate<Context>;

/**
 * The function to invoke when an error occurs while running the tool. This can be used to define
 * what the model should receive as tool output in case of an error. It can be used to provide
 * for example additional context or a fallback value.
 *
 * @param context An instance of the current RunContext
 * @param error The error that occurred
 */
export type ToolErrorFunction = (
  context: Context,
  error: Error | unknown,
) => string;
