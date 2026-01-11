import { z } from "zod";
import { Context, UnknownContext } from "@/context";
import type { BaseAgent } from "@/agent/base";

import { ModelBehaviorError } from "@/lib/error";
import { logger } from "@/lib/logger";

import {
  FAILED,
  COMPLETED,
  INTERRUPTIBLE,
  type LanguageModelTool,
} from "@kernl-sdk/protocol";
import { json } from "@kernl-sdk/shared/lib";

import type {
  ToolConfig,
  ToolApprovalFunction,
  ToolEnabledFunction,
  ToolEnabledPredicate,
  ToolErrorFunction,
  ToolExecuteArgument,
  ToolExecuteFunction,
  ToolInputParameters,
  ToolResult,
} from "./types";

/**
 * Exposes a function to the agent as a tool to be called
 *
 * @param config The options for the tool
 * @returns A new tool instance
 */
export function tool<
  TContext = UnknownContext,
  TParameters extends ToolInputParameters = undefined,
  TResult = string,
>(
  config: ToolConfig<TContext, TParameters, TResult>,
): FunctionTool<TContext, TParameters, TResult> {
  return new FunctionTool(config);
}

/**
 * Base class for all tools (function and hosted)
 */
export abstract class BaseTool<TContext = UnknownContext> {
  abstract readonly type: "function" | "hosted-tool";
  abstract readonly id: string;
  abstract readonly name?: string;

  /**
   * The function to invoke when an error occurs while running the tool.
   */
  abstract errorfn: ToolErrorFunction | null;

  /**
   * Whether the tool requires human approval before it can be called.
   */
  abstract requiresApproval: ToolApprovalFunction<any>;

  /**
   * Determines whether the tool should be exposed to the model for the current run.
   */
  abstract isEnabled(context: Context<TContext>): Promise<boolean>;

  /**
   * Serialize this tool for sending to the model
   */
  abstract serialize(): LanguageModelTool;
}

/**
 * A function tool that can be used by agents.
 */
export class FunctionTool<
  TContext = UnknownContext,
  TParameters extends ToolInputParameters = undefined,
  TResult = unknown,
> extends BaseTool<TContext> {
  readonly type = "function" as const;
  readonly id: string;
  readonly name?: string;
  readonly description: string;
  readonly parameters?: TParameters;
  readonly mode: "blocking" | "async";
  private execute: ToolExecuteFunction<TContext, TParameters, TResult>;

  errorfn: ToolErrorFunction | null;
  requiresApproval: ToolApprovalFunction<TParameters>;
  isEnabled: ToolEnabledFunction<TContext>;

  constructor(config: ToolConfig<TContext, TParameters, TResult>) {
    super();
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.parameters = config.parameters;
    this.mode = config.mode ?? "blocking";
    this.execute = config.execute;

    // setup error function
    this.errorfn =
      typeof config.errorfn === "undefined"
        ? defaultToolErrorFunction
        : config.errorfn;

    // setup approval function
    this.requiresApproval =
      typeof config.requiresApproval === "function"
        ? config.requiresApproval
        : async () =>
            typeof config.requiresApproval === "boolean"
              ? config.requiresApproval
              : false;

    // setup enabled function
    this.isEnabled =
      typeof config.isEnabled === "function"
        ? async (context) => {
            const predicate =
              config.isEnabled as ToolEnabledPredicate<TContext>;
            const result = await predicate({ context });
            return Boolean(result);
          }
        : async () =>
            typeof config.isEnabled === "boolean" ? config.isEnabled : true;
  }

  /**
   * Main invocation method -
   *
   * Wraps execute with parsing, approval, and error handling
   */
  async invoke(
    context: Context<TContext>,
    args: string,
    callId?: string,
  ): Promise<ToolResult<TResult>> {
    return this._invoke(context, args, callId).catch((error) => {
      const msg = this.errorfn
        ? this.errorfn(context, error)
        : error instanceof Error
          ? error.message
          : String(error);

      return {
        state: FAILED,
        result: undefined,
        error: msg,
      };
    });
  }

  /**
   * Executes the tool with the provided execute() function
   */
  private async _invoke(
    context: Context<TContext>,
    args: string,
    callId?: string,
  ): Promise<ToolResult<TResult>> {
    let parsed = args as ToolExecuteArgument<TParameters>;

    if (this.parameters) {
      try {
        parsed = json(this.parameters).decode(
          args,
        ) as ToolExecuteArgument<TParameters>;
      } catch (error) {
        logger.debug(`Invalid JSON input for tool ${this.id}: ${args}`);
        throw new ModelBehaviorError("Invalid JSON input for tool");
      }
    }

    // check if approval is required
    const needsApproval = await this.requiresApproval(context, parsed, callId);
    const approvalStatus = callId ? context.approvals.get(callId) : undefined;

    // (TODO): this will become a more detailed action.approval event
    if (needsApproval && approvalStatus !== "approved") {
      return {
        state: INTERRUPTIBLE,
        result: undefined,
        error: null,
      };
    }

    const result = await this.execute(context, parsed);
    return {
      state: COMPLETED,
      result: result,
      error: null,
    };
  }

  /**
   * Serialize this function tool for sending to the model
   */
  serialize(): LanguageModelTool {
    return {
      kind: "function",
      name: this.id,
      description: this.description,
      parameters: z.toJSONSchema(this.parameters ?? z.object({}), {
        target: "draft-7",
      }) as any, // use empty object if no parameters (matches AI SDK)
    };
  }
}

/**
 * Hosted tool executed server-side by the model provider
 */
export class HostedTool extends BaseTool {
  readonly type = "hosted-tool" as const;
  readonly id: string;
  readonly name?: string;
  readonly providerData?: Record<string, any>;

  /**
   * Hosted tools use the default error function
   */
  errorfn: ToolErrorFunction | null = defaultToolErrorFunction;

  /**
   * Hosted tools do not require approval by default
   */
  requiresApproval: ToolApprovalFunction<any> = async () => false;

  constructor(config: {
    id: string;
    name?: string;
    providerData?: Record<string, any>;
  }) {
    super();
    this.id = config.id;
    this.name = config.name;
    this.providerData = config.providerData;
  }

  /**
   * Hosted tools are always enabled
   */
  async isEnabled(): Promise<boolean> {
    return true;
  }

  /**
   * Serialize this hosted tool for sending to the model
   */
  serialize(): LanguageModelTool {
    return {
      kind: "provider-defined",
      id: this.id as `${string}.${string}`,
      name: this.name || this.id,
      args: this.providerData || {},
    };
  }
}

/**
 * The default function to invoke when an error occurs while running the tool.
 *
 * Always returns `An error occurred while running the tool. Please try again. Error: <error details>`
 *
 * @param context - An instance of the current Context
 * @param error - The error that occurred
 */
function defaultToolErrorFunction(context: Context, error: Error | unknown) {
  const details = error instanceof Error ? error.toString() : String(error);
  return `An error occurred while running the tool. Please try again. Error: ${details}`;
}
