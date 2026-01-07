import { Emitter } from "@kernl-sdk/shared";

import { Agent } from "./agent";
import { Context, UnknownContext } from "./context";
import { Tool } from "./tool";
import type { ToolCall } from "@kernl-sdk/protocol";

import { AgentOutputType } from "@/agent/types";
import { TextOutput } from "@/thread/types";
import type { HandoffResult } from "@/handoff";

export type AgentHookEvents<
  TContext = UnknownContext,
  TOutput extends AgentOutputType = TextOutput,
> = {
  /**
   * @param context - The context of the run
   */
  agent_start: [context: Context<TContext>, agent: Agent<TContext, TOutput>];
  /**
   * @param context - The context of the run
   * @param output - The output of the agent
   */
  agent_end: [context: Context<TContext>, output: string];
  /**
   * @param context - The context of the run
   * @param agent - The agent that is starting a tool
   * @param tool - The tool that is starting
   */
  agent_tool_start: [
    context: Context<TContext>,
    tool: Tool<any>,
    details: { toolCall: ToolCall },
  ];
  /**
   * @param context - The context of the run
   * @param agent - The agent that is ending a tool
   * @param tool - The tool that is ending
   * @param result - The result of the tool
   */
  agent_tool_end: [
    context: Context<TContext>,
    tool: Tool<any>,
    result: string,
    details: { toolCall: ToolCall },
  ];
};

/**
 * Event emitter that every Agent instance inherits from and that emits events for the lifecycle
 * of the agent.
 */
export class AgentHooks<
  TContext = UnknownContext,
  TOutput extends AgentOutputType = TextOutput,
> extends Emitter<AgentHookEvents<TContext, TOutput>> {}

/**
 * Events emitted by the kernl during execution.
 *
 * Unlike AgentHookEvents (which are emitted by individual agents with implicit context),
 * KernlHookEvents explicitly include the agent reference in all events since it needs to
 * coordinate multiple agents and listeners need to know which agent triggered each event.
 */
export type KernlHookEvents<
  TContext = UnknownContext,
  TOutput extends AgentOutputType = TextOutput,
> = {
  /**
   * @param context - The context of the run
   * @param agent - The agent that is starting
   */
  agent_start: [context: Context<TContext>, agent: Agent<TContext, TOutput>];
  /**
   * @param context - The context of the run
   * @param agent - The agent that is ending
   * @param output - The output of the agent
   */
  agent_end: [
    context: Context<TContext>,
    agent: Agent<TContext, TOutput>,
    output: string,
  ];
  /**
   * @param context - The context of the run
   * @param agent - The agent that initiated the handoff
   * @param handoff - The handoff result containing from, to, and message
   */
  agent_handoff: [
    context: Context<TContext>,
    agent: Agent<TContext, TOutput>,
    handoff: HandoffResult,
  ];
  /**
   * @param context - The context of the run
   * @param agent - The agent that is starting a tool
   * @param tool - The tool that is starting
   */
  agent_tool_start: [
    context: Context<TContext>,
    agent: Agent<TContext, TOutput>,
    tool: Tool,
    details: { toolCall: ToolCall },
  ];
  /**
   * @param context - The context of the run
   * @param agent - The agent that is ending a tool
   * @param tool - The tool that is ending
   * @param result - The result of the tool
   */
  agent_tool_end: [
    context: Context<TContext>,
    agent: Agent<TContext, TOutput>,
    tool: Tool,
    result: string,
    details: { toolCall: ToolCall },
  ];
};

/**
 * Event emitter that the kernl uses to emit events for the lifecycle of every agent run.
 */
export class KernlHooks<
  TContext = UnknownContext,
  TOutput extends AgentOutputType = TextOutput,
> extends Emitter<KernlHookEvents<TContext, TOutput>> {}
