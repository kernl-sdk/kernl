import type { Codec } from "@kernl-sdk/shared/lib";
import type { ThreadEvent } from "kernl";
import type {
  Message as LanguageModelMessage,
  ToolCall,
  ToolResult,
  Reasoning,
  MessagePart,
} from "@kernl-sdk/protocol";

/**
 * OpenCode part types.
 */
export type PartType =
  | "text"
  | "file"
  | "tool"
  | "tool-use"
  | "tool-result"
  | "tool-invocation"
  | "reasoning";

export interface Part {
  id: string;
  type: PartType;
  text?: string;
  toolName?: string;
  toolId?: string;
  callID?: string;
  tool?: string;
  args?: string;
  result?: string;
  input?: unknown;
  output?: string;
  state?: unknown;
  seq?: number;
  url?: string;
  mime?: string;
  filename?: string;
}

/**
 * OpenCode message format.
 */
export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  createdAt: string;
  seq?: number;
  parts: Part[];
}

/**
 * Thread history with session context.
 */
export interface ThreadHistory {
  sessionId: string;
  events: ThreadEvent[];
}

/**
 * Codec for converting between kernl thread events and OpenCode messages.
 *
 * - encode: ThreadHistory → Message[] (for API responses)
 * - decode: Message[] → ThreadHistory (for reconstructing history)
 */
export const MessageCodec: Codec<ThreadHistory, Message[]> = {
  encode({ sessionId, events }: ThreadHistory): Message[] {
    const messages: Message[] = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      if (event.kind === "message") {
        const msg = event as LanguageModelMessage & ThreadEvent;

        // Collect all parts with their original thread seq for sorting
        const partsWithSeq: Array<{ part: Part; threadSeq: number }> = [];

        // convert message content parts
        for (const part of msg.content) {
          const mpart = part as MessagePart;
          switch (mpart.kind) {
            case "text":
              partsWithSeq.push({
                part: {
                  id: `${msg.id}-text-${partsWithSeq.length}`,
                  type: "text",
                  text: mpart.text,
                },
                threadSeq: msg.seq,
              });
              break;

            case "file":
              partsWithSeq.push({
                part: {
                  id: `${msg.id}-file-${partsWithSeq.length}`,
                  type: "file",
                  url:
                    mpart.uri || `data:${mpart.mimeType};base64,${mpart.data}`,
                  mime: mpart.mimeType,
                  filename: mpart.filename,
                },
                threadSeq: msg.seq,
              });
              break;
          }
        }

        // for assistant messages, look ahead for tool calls/results
        if (msg.role === "assistant") {
          let j = i + 1;
          const toolMap = new Map<
            string,
            {
              call?: ToolCall & ThreadEvent;
              result?: ToolResult & ThreadEvent;
            }
          >();
          const reasoningParts: (Reasoning & ThreadEvent)[] = [];

          while (j < events.length && events[j].kind !== "message") {
            const next = events[j];

            if (next.kind === "tool.call") {
              const call = next as ToolCall & ThreadEvent;
              const existing = toolMap.get(call.callId) || {};
              toolMap.set(call.callId, { ...existing, call });
            } else if (next.kind === "tool.result") {
              const result = next as ToolResult & ThreadEvent;
              const existing = toolMap.get(result.callId) || {};
              toolMap.set(result.callId, { ...existing, result });
            } else if (next.kind === "reasoning") {
              reasoningParts.push(next as Reasoning & ThreadEvent);
            }

            j++;
          }

          // add reasoning parts
          for (const reasoning of reasoningParts) {
            partsWithSeq.push({
              part: {
                id: reasoning.id,
                type: "reasoning",
                text: reasoning.text,
              },
              threadSeq: reasoning.seq,
            });
          }

          // convert tool pairs to OpenCode parts
          for (const [callId, { call, result }] of toolMap.entries()) {
            if (!call) continue;

            const input = JSON.parse(call.arguments || "{}");
            const status = result
              ? result.state === "failed"
                ? "error"
                : "completed"
              : "running";

            partsWithSeq.push({
              part: {
                id: callId,
                type: "tool",
                callID: callId,
                tool: call.toolId,
                state: {
                  status,
                  input,
                  output:
                    result?.result != null ? String(result.result) : undefined,
                  title: call.toolId,
                  metadata:
                    result?.result != null ? { output: result.result } : {},
                  time: {
                    start: call.timestamp.getTime(),
                    ...(result && { end: result.timestamp.getTime() }),
                  },
                },
              },
              threadSeq: call.seq,
            });
          }

          // skip processed events
          i = j - 1;
        }

        // Skip system messages - OpenCode only supports user/assistant
        if (msg.role === "system") continue;

        // Sort by thread seq to preserve original order, then assign per-message seq
        partsWithSeq.sort((a, b) => a.threadSeq - b.threadSeq);
        const parts = partsWithSeq.map((p, idx) => ({ ...p.part, seq: idx }));

        messages.push({
          id: msg.id,
          sessionId,
          role: msg.role,
          createdAt: msg.timestamp.toISOString(),
          seq: msg.seq,
          parts,
        });
      }
    }

    return messages;
  },

  decode(messages: Message[]): ThreadHistory {
    if (messages.length === 0) {
      return { sessionId: "", events: [] };
    }

    const sessionId = messages[0].sessionId;
    const events: ThreadEvent[] = [];
    let seq = 0;

    for (const msg of messages) {
      const contentParts: MessagePart[] = [];
      const toolCalls: (ToolCall & ThreadEvent)[] = [];
      const toolResults: (ToolResult & ThreadEvent)[] = [];

      for (const part of msg.parts) {
        switch (part.type) {
          case "text":
            contentParts.push({ kind: "text", text: part.text ?? "" });
            break;

          case "file":
            if (part.url) {
              contentParts.push({
                kind: "file",
                mimeType: part.mime ?? "application/octet-stream",
                uri: part.url,
                filename: part.filename,
              });
            }
            break;

          case "tool": {
            const state = part.state as {
              status: string;
              input: unknown;
              output?: string;
              time?: { start: number; end?: number };
            };

            toolCalls.push({
              kind: "tool.call",
              callId: part.callID ?? part.id,
              toolId: part.tool ?? "",
              arguments: JSON.stringify(state?.input ?? {}),
              state: "completed",
              id: part.id,
              tid: sessionId,
              seq: seq++,
              timestamp: new Date(state?.time?.start ?? Date.now()),
              metadata: {},
            } as ToolCall & ThreadEvent);

            if (state?.output !== undefined) {
              toolResults.push({
                kind: "tool.result",
                callId: part.callID ?? part.id,
                toolId: part.tool ?? "",
                result: state.output,
                error: null,
                state: state.status === "error" ? "failed" : "completed",
                id: `${part.id}-result`,
                tid: sessionId,
                seq: seq++,
                timestamp: new Date(state?.time?.end ?? Date.now()),
                metadata: {},
              } as ToolResult & ThreadEvent);
            }
            break;
          }
        }
      }

      // add message event
      events.push({
        kind: "message",
        id: msg.id,
        role: msg.role,
        content: contentParts,
        tid: sessionId,
        seq: seq++,
        timestamp: new Date(msg.createdAt),
        metadata: {},
      } as LanguageModelMessage & ThreadEvent);

      // add tool events after assistant message
      if (msg.role === "assistant") {
        events.push(...toolCalls, ...toolResults);
      }
    }

    return { sessionId, events };
  },
};
