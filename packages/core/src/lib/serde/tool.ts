import type { ToolInputParameters } from "@/tool/types";

/**
 * Serialized function tool for model requests
 */
export type SerializedFunctionTool = {
  /**
   * The type of the tool.
   */
  type: "function";

  /**
   * The name of the tool.
   */
  name?: string;

  /**
   * The description of the tool that helps the model to understand when to use the tool
   */
  description: string;

  /**
   * A JSON schema describing the parameters of the tool.
   */
  parameters: ToolInputParameters;
};

/**
 * Serialized hosted tool for model requests
 */
export type SerializedHostedTool = {
  type: "hosted-tool";
  id: string;
  name?: string;
  providerData?: Record<string, any>;
};

/**
 * Union of all serialized tool types
 */
export type SerializedTool = SerializedFunctionTool | SerializedHostedTool;
