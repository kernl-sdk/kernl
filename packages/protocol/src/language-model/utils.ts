import { SharedProviderMetadata } from "@/provider";

import { randomID } from "@kernl-sdk/shared/lib";
import { Message, Reasoning } from "./item";

/**
 * Create a message with text content
 */
export function message(options: {
  role: "system" | "assistant" | "user";
  text: string;
  metadata?: Record<string, unknown>;
  providerMetadata?: SharedProviderMetadata;
}): Message {
  return {
    kind: "message",
    role: options.role,
    id: `msg_${randomID()}`,
    content: [{ kind: "text", text: options.text }],
    providerMetadata: options.providerMetadata,
    metadata: options.metadata,
  };
}

/**
 * Create a reasoning item
 */
export function reasoning(options: {
  text: string;
  providerMetadata?: SharedProviderMetadata;
}): Reasoning {
  return {
    kind: "reasoning",
    id: `rsn_${randomID()}`,
    text: options.text,
    providerMetadata: options.providerMetadata,
  };
}
