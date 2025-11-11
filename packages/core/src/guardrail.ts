import { z, type ZodType } from "zod";

import { Agent } from "./agent";
import { Context, UnknownContext } from "./context";
import { LanguageModelResponse } from "./model";

import type { AgentResponseType } from "./types/agent";
import type { TextResponse, ThreadEvent } from "./types/thread";

/**
 * Resolves the agent output type based on the response type.
 * - If TResponse is "text" → output is string
 * - If TResponse is a ZodType → output is the inferred type from that schema
 */
export type ResolvedAgentResponse<TResponse extends AgentResponseType> =
  TResponse extends TextResponse
    ? string
    : TResponse extends ZodType
      ? z.infer<TResponse>
      : never;

/**
 * The output of a guardrail function.
 */
export interface GuardrailFunctionOutput {
  /**
   * Whether the tripwire was triggered. If triggered, the agent's execution will be halted.
   */
  tripwireTriggered: boolean;
  /**
   * Optional information about the guardrail's output.
   * For example, the guardrail could include information about the checks it performed and granular results.
   */
  outputInfo: any; // (TODO): better name
}

// ----------------------------------------------------------
// Input Guardrail
// ----------------------------------------------------------

/**
 * A guardrail that checks the input to the agent.
 */
export interface InputGuardrail {
  /**
   * The name of the guardrail.
   */
  name: string;

  /**
   * The function that performs the guardrail check
   */
  execute: InputGuardrailFunction;
}

/**
 * The result of an input guardrail execution.
 */
export interface InputGuardrailResult {
  /**
   * The metadata of the guardrail.
   */
  guardrail: InputGuardrailMetadata;

  /**
   * The output of the guardrail.
   */
  output: GuardrailFunctionOutput;
}

/**
 * Arguments for an input guardrail function.
 */
export interface InputGuardrailFunctionArgs<TContext = UnknownContext> {
  /**
   * The agent that is being run.
   */
  agent: Agent<any, any>;

  /**
   * The input to the agent.
   */
  input: string | ThreadEvent[];

  /**
   * The context of the agent run.
   */
  context: Context<TContext>;
}

/**
 * The function that performs the actual input guardrail check and returns the decision on whether
 * a guardrail was triggered.
 */
export type InputGuardrailFunction = (
  args: InputGuardrailFunctionArgs,
) => Promise<GuardrailFunctionOutput>;

/**
 * Metadata for an input guardrail.
 */
export interface InputGuardrailMetadata {
  type: "input";
  name: string;
}

/**
 * Definition of an input guardrail. SDK users usually do not need to create this.
 */
export interface InputGuardrailDefinition extends InputGuardrailMetadata {
  guardrailFunction: InputGuardrailFunction;
  run(args: InputGuardrailFunctionArgs): Promise<InputGuardrailResult>;
}

/**
 * Arguments for defining an input guardrail definition.
 */
export interface DefineInputGuardrailArgs {
  name: string;
  execute: InputGuardrailFunction;
}

/**
 * Defines an input guardrail definition.
 */
export function defineInputGuardrail({
  name,
  execute,
}: DefineInputGuardrailArgs): InputGuardrailDefinition {
  return {
    type: "input",
    name,
    guardrailFunction: execute,
    async run(args: InputGuardrailFunctionArgs): Promise<InputGuardrailResult> {
      return {
        guardrail: { type: "input", name },
        output: await execute(args),
      };
    },
  };
}

// ----------------------------------------------------------
// Output Guardrail
// ----------------------------------------------------------

/**
 * Arguments for an output guardrail function.
 */
export interface OutputGuardrailFunctionArgs<
  TContext = UnknownContext,
  TResponse extends AgentResponseType = TextResponse,
> {
  agent: Agent<any, any>;
  agentOutput: ResolvedAgentResponse<TResponse>; // ??
  context: Context<TContext>;
  /**
   * Additional details about the agent output.
   */
  details?: {
    /** Model response associated with the output if available. */
    modelResponse?: LanguageModelResponse;
  };
}
/**
 * A function that takes an output guardrail function arguments and returns a `GuardrailFunctionOutput`.
 */
export type OutputGuardrailFunction<
  TResponse extends AgentResponseType = TextResponse,
> = (
  args: OutputGuardrailFunctionArgs<UnknownContext, TResponse>,
) => Promise<GuardrailFunctionOutput>;

/**
 * A guardrail that checks the output of the agent.
 */
export interface OutputGuardrail<
  TResponse extends AgentResponseType = TextResponse,
> {
  /**
   * The name of the guardrail.
   */
  name: string;

  /**
   * The function that performs the guardrail check.
   */
  execute: OutputGuardrailFunction<TResponse>;
}

/**
 * Metadata for an output guardrail.
 */
export interface OutputGuardrailMetadata {
  type: "output";
  name: string;
}

/**
 * The result of an output guardrail execution.
 */
export interface OutputGuardrailResult<
  TMeta = OutputGuardrailMetadata,
  TResponse extends AgentResponseType = TextResponse,
> {
  /**
   * The metadata of the guardrail.
   */
  guardrail: TMeta;

  /**
   * The output of the agent that ran.
   */
  agentOutput: ResolvedAgentResponse<TResponse>; // ??

  /**
   * The agent that ran.
   */
  agent: Agent<UnknownContext, TResponse>;

  /**
   * The output of the guardrail.
   */
  output: GuardrailFunctionOutput;
}

/**
 * Definition of an output guardrail.
 */
export interface OutputGuardrailDefinition<
  TMeta = OutputGuardrailMetadata,
  TResponse extends AgentResponseType = TextResponse,
> extends OutputGuardrailMetadata {
  guardrailFunction: OutputGuardrailFunction<TResponse>;
  run(
    args: OutputGuardrailFunctionArgs<UnknownContext, TResponse>,
  ): Promise<OutputGuardrailResult<TMeta, TResponse>>;
}

/**
 * Arguments for defining an output guardrail definition.
 */
export interface DefineOutputGuardrailArgs<
  TResponse extends AgentResponseType = TextResponse,
> {
  name: string;
  execute: OutputGuardrailFunction<TResponse>;
}

/**
 * Creates an output guardrail definition.
 */
export function defineOutputGuardrail<
  TResponse extends AgentResponseType = TextResponse,
>({
  name,
  execute,
}: DefineOutputGuardrailArgs<TResponse>): OutputGuardrailDefinition<
  OutputGuardrailMetadata,
  TResponse
> {
  return {
    type: "output",
    name,
    guardrailFunction: execute,
    async run(
      args: OutputGuardrailFunctionArgs<UnknownContext, TResponse>,
    ): Promise<OutputGuardrailResult<OutputGuardrailMetadata, TResponse>> {
      return {
        guardrail: { type: "output", name },
        agent: args.agent,
        agentOutput: args.agentOutput,
        output: await execute(args),
      };
    },
  };
}
