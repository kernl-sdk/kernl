import {
  InputGuardrailResult,
  OutputGuardrailMetadata,
  OutputGuardrailResult,
} from "@/guardrail";

import { randomID } from "@kernl-sdk/shared/lib";
// TODO: implement checkpointing/serialization
// import { SerializedThread } from "@/lib/serde/thread";
type SerializedThread = any;

import { AgentResponseType } from "@/types/agent";
import { TextResponse } from "@/types/thread";

/**
 * Abstract base class for all `kernl` errors
 * Requires subclasses to implement JSON serialization
 */
export abstract class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * Convert error to JSON representation
   * Must be implemented by subclasses
   */
  abstract toJSON(): Record<string, any>;
}

/**
 * Runtime error with trace ID for debugging
 */
export class RuntimeError extends BaseError {
  public readonly traceId: string;

  constructor(message: string, traceId?: string) {
    super(message);
    this.traceId = traceId || randomID();
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      traceId: this.traceId,
      stack: this.stack,
    };
  }
}

/**
 * Base class for all errors thrown by the library.
 */
export abstract class AgentError extends RuntimeError {
  thread?: SerializedThread;

  constructor(message: string, state?: SerializedThread, traceId?: string) {
    super(message, traceId);
    this.thread = state;
  }

  override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      thread: this.thread,
    };
  }
}

/**
 * System error thrown when the library encounters an error that is not caused by the user's
 * misconfiguration.
 */
export class SystemError extends RuntimeError {}

/**
 * Thrown due to user misconfiguration
 *
 * This error indicates that the library was not configured correctly by the user.
 * Common causes include invalid configuration options, missing required fields,
 * or incompatible configuration combinations.
 */
export class MisconfiguredError extends BaseError {
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
    };
  }
}

/**
 * Error thrown when the maximum number of turns is exceeded.
 */
export class MaxTurnsExceededError extends AgentError {}

/**
 * Error thrown when a model behavior is unexpected.
 */
export class ModelBehaviorError extends AgentError {}

/**
 * Error thrown when a guardrail execution fails.
 */
export class GuardrailExecutionError extends AgentError {
  error: Error;
  constructor(message: string, error: Error, thread?: SerializedThread) {
    super(message, thread);
    this.error = error;
  }
}

/**
 * Error thrown when a tool call fails.
 */
export class ToolCallError extends AgentError {
  error: Error;
  constructor(message: string, error: Error, thread?: SerializedThread) {
    super(message, thread);
    this.error = error;
  }
}

/**
 * Error thrown when an input guardrail tripwire is triggered.
 */
export class InputGuardrailTripwireTriggered extends AgentError {
  result: InputGuardrailResult;
  constructor(
    message: string,
    result: InputGuardrailResult,
    thread?: SerializedThread,
  ) {
    super(message, thread);
    this.result = result;
  }
}

/**
 * Error thrown when an output guardrail tripwire is triggered.
 */
export class OutputGuardrailTripwireTriggered<
  TMeta extends OutputGuardrailMetadata,
  TOutputType extends AgentResponseType = TextResponse,
> extends AgentError {
  result: OutputGuardrailResult<TMeta, TOutputType>;
  constructor(
    message: string,
    result: OutputGuardrailResult<TMeta, TOutputType>,
    thread?: SerializedThread,
  ) {
    super(message, thread);
    this.result = result;
  }
}
