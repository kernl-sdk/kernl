import type { JSONSchema7 } from "json-schema";

import { SharedProviderOptions } from "@/provider";

import { LanguageModelItem } from "./item";
import { LanguageModelFunctionTool, LanguageModelProviderTool } from "./tool";

export type LanguageModelTool =
  | LanguageModelFunctionTool
  | LanguageModelProviderTool;

/**
 * A request to a large language model.
 */
export interface LanguageModelRequest {
  /**
   * The input to the model.
   */
  input: LanguageModelItem[];

  /**
   * The model settings to use for the request.
   */
  settings: LanguageModelRequestSettings;

  /**
   * Response format. The output can either be text or JSON. Default is text.
   *
   * If JSON is selected, a schema can optionally be provided to guide the LLM.
   */
  responseType?: LanguageModelResponseType;

  /**
   * The tools that are available for the model.
   */
  tools?: LanguageModelTool[];

  /**
Include raw chunks in the stream. Only applicable for streaming calls.
 */
  includeRawChunks?: boolean;

  /**
   * Abort signal for cancelling the operation.
   */
  abort?: AbortSignal;
}

/**
 * Response format specification for language model output.
 *
 * The output can either be text or JSON. Default is text.
 * If JSON is selected, a schema can optionally be provided to guide the LLM.
 */
export type LanguageModelResponseType =
  | LanguageModelResponseText
  | LanguageModelResponseJSON;

/**
 * Text response format.
 */
export interface LanguageModelResponseText {
  readonly kind: "text";
}

/**
 * JSON response format.
 */
export interface LanguageModelResponseJSON {
  readonly kind: "json";

  /**
   * JSON schema that the generated output should conform to.
   */
  schema?: JSONSchema7;

  /**
   * Name of output that should be generated. Used by some providers for additional LLM guidance.
   */
  name?: string;

  /**
   * Description of the output that should be generated. Used by some providers for additional LLM guidance.
   */
  description?: string;
}

/**
 * Settings to use when calling an LLM.
 *
 * This class holds optional model configuration parameters (e.g. temperature,
 * topP, penalties, truncation, etc.).
 *
 * Not all models/providers support all of these parameters, so please check the API documentation
 * for the specific model and provider you are using.
 */
export interface LanguageModelRequestSettings {
  /**
   * The temperature to use when calling the model.
   */
  temperature?: number;

  /**
   * The topP to use when calling the model.
   */
  topP?: number;

  /**
   * The frequency penalty to use when calling the model.
   */
  frequencyPenalty?: number;

  /**
   * The presence penalty to use when calling the model.
   */
  presencePenalty?: number;

  /**
   * The tool choice to use when calling the model.
   */
  toolChoice?: LanguageModelToolChoice;

  /**
   * Whether to use parallel tool calls when calling the model.
   * Defaults to false if not provided.
   */
  parallelToolCalls?: boolean;

  /**
   * The truncation strategy to use when calling the model.
   */
  truncation?: "auto" | "disabled";

  /**
   * The maximum number of output tokens to generate.
   */
  maxTokens?: number;

  /**
   * Whether to store the generated model response for later retrieval.
   * Defaults to true if not provided.
   */
  store?: boolean;

  /**
   * The reasoning settings to use when calling the model.
   */
  reasoning?: ModelSettingsReasoning;

  /**
   * The text settings to use when calling the model.
   */
  text?: ModelSettingsText;

  /**
   * Additional provider specific metadata to be passed directly to the model
   * request.
   */
  providerOptions?: SharedProviderOptions;
}

export type LanguageModelToolChoice =
  | { kind: "auto" } /* the tool selection is automatic (can be no tool) */
  | { kind: "none" } /* no tool must be selected */
  | { kind: "required" } /* one of the available tools must be selected */
  | { kind: "tool"; toolId: string }; /* a specific tool must be selected: */

/**
 * Constrains effort on reasoning for [reasoning models](https://platform.openai.com/docs/guides/reasoning).
 *
 * Supported for providers:
 *
 *  - OpenAI
 *  - ... ?
 */
export type ModelSettingsReasoningEffort =
  | "minimal"
  | "low"
  | "medium"
  | "high"
  | null;

/**
 * Configuration options for model reasoning
 */
export type ModelSettingsReasoning = {
  /**
   * Constrains effort on reasoning for [reasoning models](https://platform.openai.com/docs/guides/reasoning).
   */
  effort?: ModelSettingsReasoningEffort | null;

  /**
   * A summary of the reasoning performed by the model.
   * This can be useful for debugging and understanding the model's reasoning process.
   * One of `auto`, `concise`, or `detailed`.
   */
  summary?: "auto" | "concise" | "detailed" | null;
};

export interface ModelSettingsText {
  /**
   * Constrains the verbosity of the model's response.
   *
   * Supported for providers:
   *
   *  - OpenAI
   *  - ... ?
   */
  verbosity?: "low" | "medium" | "high" | null;
}
