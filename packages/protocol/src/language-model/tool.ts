import type { JSONSchema7 } from "json-schema";
import type { SharedProviderOptions } from "@/provider";

/**
 * A tool has a name, a description, and a set of parameters.
 *
 * Note: this is **not** the user-facing tool definition. The AI SDK methods will
 * map the user-facing tool definitions to this format.
 */
export type LanguageModelFunctionTool = {
  readonly kind: "function";

  /**
   * The name of the tool. Unique within this model call.
   */
  name: string;

  /**
   * A description of the tool. The language model uses this to understand the
   * tool's purpose and to provide better completion suggestions.
   */
  description?: string;

  /**
   * The parameters that the tool expects. The language model uses this to
   * understand the tool's input requirements and to provide matching suggestions.
   */
  parameters: JSONSchema7;

  /**
   * The provider-specific options for the tool.
   */
  providerOptions?: SharedProviderOptions;
};

/**
 * The configuration of a tool that is defined by the provider.
 */
export type LanguageModelProviderTool = {
  readonly kind: "provider-defined";

  /**
   * The ID of the tool. Should follow the format `<provider-id>.<unique-tool-name>`.
   */
  id: `${string}.${string}`;

  /**
   * The name of the tool that the user must use in the tool set.
   */
  name: string;

  /**
   * The arguments for configuring the tool. Must match the expected arguments defined by the provider for this tool.
   */
  args: Record<string, unknown>;
};
