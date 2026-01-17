import { randomID } from "@kernl-sdk/shared/lib";

/**
 * In-memory message store.
 * Maps OpenCode messages/parts ↔ kernl events.
 */

export type PartType = "text" | "file" | "tool-use" | "tool-result" | "tool-invocation" | "reasoning";

export interface Part {
  id: string;
  type: PartType;
  text?: string;
  toolName?: string;
  toolId?: string;
  args?: string;
  result?: string;
  // tool-invocation fields
  tool?: { name: string };
  input?: unknown;
  output?: string;
  state?: "pending" | "completed" | "error";
  seq?: number;
  // file fields
  url?: string;
  mime?: string;
  filename?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  createdAt: string;
  parts: Part[];
}

const messages = new Map<string, Message[]>();

export function list(sessionId: string): Message[] {
  return messages.get(sessionId) || [];
}

export function add(sessionId: string, message: Omit<Message, "id" | "createdAt"> & { id?: string }): Message {
  const msg: Message = {
    ...message,
    id: message.id || randomID(),
    createdAt: new Date().toISOString(),
  };

  const existing = messages.get(sessionId) || [];
  existing.push(msg);
  messages.set(sessionId, existing);

  return msg;
}

export function get(sessionId: string, messageId: string): Message | undefined {
  const sessionMessages = messages.get(sessionId);
  return sessionMessages?.find((m) => m.id === messageId);
}

export function updatePart(sessionId: string, messageId: string, part: Part): Message | undefined {
  const sessionMessages = messages.get(sessionId);
  if (!sessionMessages) return undefined;

  const message = sessionMessages.find((m) => m.id === messageId);
  if (!message) return undefined;

  const existingPartIndex = message.parts.findIndex((p) => p.id === part.id);
  if (existingPartIndex >= 0) {
    message.parts[existingPartIndex] = part;
  } else {
    message.parts.push(part);
  }

  return message;
}

export function clear(sessionId: string): void {
  messages.delete(sessionId);
}
