import type {
  Codec,
  LanguageModelTool,
  LanguageModelToolChoice,
} from "@kernl/protocol";
import type {
  LanguageModelV3FunctionTool,
  LanguageModelV3ProviderDefinedTool,
  LanguageModelV3ToolChoice,
} from "@ai-sdk/provider";

export const TOOL: Codec<
  LanguageModelTool,
  LanguageModelV3FunctionTool | LanguageModelV3ProviderDefinedTool
> = {
  encode: (tool) => {
    if (tool.kind === "function") {
      return {
        type: "function",
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters,
        providerOptions: tool.providerOptions,
      } satisfies LanguageModelV3FunctionTool;
    } else {
      // provider-defined
      return {
        type: "provider-defined",
        id: tool.id,
        name: tool.name,
        args: tool.args,
      } satisfies LanguageModelV3ProviderDefinedTool;
    }
  },
  decode: () => {
    throw new Error("codec:unimplemented");
  },
};

export const TOOL_CHOICE: Codec<
  LanguageModelToolChoice,
  LanguageModelV3ToolChoice
> = {
  encode: (choice) => {
    switch (choice.kind) {
      case "auto":
        return { type: "auto" };
      case "none":
        return { type: "none" };
      case "required":
        return { type: "required" };
      case "tool":
        return { type: "tool", toolName: choice.toolId };
    }
  },
  decode: () => {
    throw new Error("codec:unimplemented");
  },
};
