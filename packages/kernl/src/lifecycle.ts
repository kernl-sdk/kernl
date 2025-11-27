import { EventEmitter } from "node:events";

import { Agent } from "./agent";
import { Context, UnknownContext } from "./context";
import { Tool } from "./tool";
import type { ToolCall } from "@kernl-sdk/protocol";

import { AgentResponseType } from "@/agent/types";
import { TextResponse } from "@/thread/types";

export type EventEmitterEvents = Record<string, any[]>;

/**
 * Generic typed event emitter that wraps Node's EventEmitter with type safety
 */
class TypedEventEmitter<
  EventTypes extends EventEmitterEvents = Record<string, any[]>,
> extends EventEmitter {
  // Overload for typed events
  on<K extends keyof EventTypes>(
    event: K,
    listener: (...args: EventTypes[K]) => void,
  ): this;
  // Fallback for compatibility with parent
  on(event: string | symbol, listener: (...args: any[]) => void): this;
  on(event: any, listener: any): this {
    return super.on(event, listener);
  }

  // Overload for typed events
  off<K extends keyof EventTypes>(
    event: K,
    listener: (...args: EventTypes[K]) => void,
  ): this;
  // Fallback for compatibility with parent
  off(event: string | symbol, listener: (...args: any[]) => void): this;
  off(event: any, listener: any): this {
    return super.off(event, listener);
  }

  // Overload for typed events
  emit<K extends keyof EventTypes>(event: K, ...args: EventTypes[K]): boolean;
  // Fallback for compatibility with parent
  emit(event: string | symbol, ...args: any[]): boolean;
  emit(event: any, ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  // Overload for typed events
  once<K extends keyof EventTypes>(
    event: K,
    listener: (...args: EventTypes[K]) => void,
  ): this;
  // Fallback for compatibility with parent
  once(event: string | symbol, listener: (...args: any[]) => void): this;
  once(event: any, listener: any): this {
    return super.once(event, listener);
  }
}

export type AgentHookEvents<
  TContext = UnknownContext,
  TOutput extends AgentResponseType = TextResponse,
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
  // /**
  //  * @param context - The context of the run
  //  * @param agent - The agent that is handing off
  //  * @param nextAgent - The next agent to run
  //  */
  // agent_handoff: [context: Context<TContext>, nextAgent: Agent<any, any>];
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
  TOutput extends AgentResponseType = TextResponse,
> extends TypedEventEmitter<AgentHookEvents<TContext, TOutput>> {}

/**
 * Events emitted by the kernl during execution.
 *
 * Unlike AgentHookEvents (which are emitted by individual agents with implicit context),
 * KernlHookEvents explicitly include the agent reference in all events since it needs to
 * coordinate multiple agents and listeners need to know which agent triggered each event.
 */
export type KernlHookEvents<
  TContext = UnknownContext,
  TOutput extends AgentResponseType = TextResponse,
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
   * @param fromAgent - The agent that is handing off
   * @param toAgent - The next agent to run
   */
  agent_handoff: [
    context: Context<TContext>,
    fromAgent: Agent<any, any>,
    toAgent: Agent<any, any>,
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
  TOutput extends AgentResponseType = TextResponse,
> extends TypedEventEmitter<KernlHookEvents<TContext, TOutput>> {}
