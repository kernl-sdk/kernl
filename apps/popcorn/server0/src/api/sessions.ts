import { Hono } from "hono";
import { randomID } from "@kernl-sdk/shared/lib";
import type { Kernl, Agent } from "kernl";
import type { LanguageModel } from "@kernl-sdk/protocol";
import { fileURLToPath } from "node:url";

import * as store from "@/state/sessions";
import * as messageStore from "@/state/messages";
import * as todoStore from "@/state/todos";
import * as events from "@/state/events";
import * as providerStore from "@/state/providers";
import { titler } from "@/agents/titler";
import { createModel } from "@/lib/models";
import { read as readTool } from "@/toolkits/fs/read";

/**
 * Generate session title asynchronously.
 */
async function title(
  message: string,
  sessionId: string,
  directory: string,
): Promise<void> {
  try {
    const res = await titler.run(`User message: ${message}`);
    store.update(sessionId, { title: res.response.trim() });
    events.emit(directory, {
      type: "session.updated",
      properties: { info: store.get(sessionId) },
    });
  } catch (err) {
    console.error("[sessions] titler error:", err);
  }
}

type Variables = { kernl: Kernl };

export const sessions = new Hono<{ Variables: Variables }>();

/**
 * List all sessions.
 */
sessions.get("/", async (cx) => {
  return cx.json(store.list());
});

/**
 * Create a new session.
 */
sessions.post("/", async (cx) => {
  const directory = cx.req.header("x-opencode-directory") ?? process.cwd();
  const body = await cx.req.json().catch(() => ({}));
  const session = store.create({ ...body, directory });
  return cx.json(session);
});

/**
 * Get status of all sessions.
 */
sessions.get("/status", (cx) => {
  return cx.json({});
});

/**
 * Get a session by ID.
 */
sessions.get("/:id", async (cx) => {
  const id = cx.req.param("id");
  const session = store.get(id);
  if (!session) {
    return cx.json({ error: "session not found" }, 404);
  }
  return cx.json(session);
});

/**
 * Update a session.
 */
sessions.patch("/:id", async (cx) => {
  const id = cx.req.param("id");
  const body = await cx.req.json();
  const session = store.update(id, body);
  if (!session) {
    return cx.json({ error: "session not found" }, 404);
  }
  return cx.json(session);
});

/**
 * Delete a session.
 */
sessions.delete("/:id", async (cx) => {
  const id = cx.req.param("id");
  const deleted = store.remove(id);
  if (!deleted) {
    return cx.json({ error: "session not found" }, 404);
  }
  return cx.json({ deleted: true, id });
});

/**
 * Get messages for a session.
 */
sessions.get("/:id/message", async (cx) => {
  const sessionId = cx.req.param("id");
  const session = store.get(sessionId);
  if (!session) {
    return cx.json({ error: "session not found" }, 404);
  }
  // Transform to SDK expected format: Array<{ info: Message, parts: Part[] }>
  const messages = messageStore.list(sessionId);
  const transformed = messages.map((msg) => ({
    info: {
      id: msg.id,
      sessionID: msg.sessionId,
      role: msg.role,
      time: { created: new Date(msg.createdAt).getTime() },
      mode: "default",
      agent: "Coder",
      modelID: "claude-sonnet-4-20250514",
      providerID: "anthropic",
      tokens: {
        input: 0,
        output: 0,
        reasoning: 0,
        cache: { read: 0, write: 0 },
      },
      cost: 0,
    },
    parts: msg.parts,
  }));
  return cx.json(transformed);
});

/**
 * Send a message (prompt) and process in background.
 * Events are emitted to global event bus for SSE clients.
 */
sessions.post("/:id/message", async (cx) => {
  const sessionId = cx.req.param("id");
  const directory = cx.req.header("x-opencode-directory") ?? "";
  const kernl = cx.get("kernl");
  let session = store.get(sessionId);

  // auto-create session if it doesn't exist
  if (!session) {
    session = store.create({ id: sessionId, directory });
  }

  const body = await cx.req.json();
  const clientMessageId = body.messageID;
  const agentId = (body.agent as string | undefined) ?? "codex";

  // Parse all parts from request
  const requestParts = (body.parts ?? []) as Array<{
    id?: string;
    type: string;
    text?: string;
    url?: string;
    mime?: string;
    filename?: string;
    source?: unknown;
  }>;

  // Extract text content (for title generation and AI processing)
  const textParts = requestParts.filter((p) => p.type === "text");
  const content =
    textParts.map((p) => p.text ?? "").join("\n") || body.content || "";

  // Extract file parts (images, PDFs, text files, etc.)
  // Note: directories are excluded since they're handled differently
  const fileParts = requestParts.filter(
    (p) => p.type === "file" && p.mime && p.mime !== "application/x-directory",
  );

  // Extract model from request (if provided)
  const requestModel = body.model as
    | { providerID: string; modelID: string }
    | undefined;
  const model = requestModel
    ? createModel(requestModel.providerID, requestModel.modelID)
    : undefined;

  // Validate agent matches thread (if thread exists)
  const existingThread = await kernl.threads.get(sessionId);
  if (existingThread && existingThread.agentId !== agentId) {
    const expectedAgent = kernl.agents.get(existingThread.agentId);
    events.emit(directory, {
      type: "session.error",
      properties: {
        sessionID: sessionId,
        error: {
          name: "AgentMismatchError",
          data: {
            message: `This thread uses ${expectedAgent?.name ?? existingThread.agentId}. Start a new session to use a different agent.`,
          },
        },
      },
    });
    return cx.json({ error: "agent mismatch" }, 400);
  }

  // Generate title on first message (when session has no messages yet)
  const existingMessages = messageStore.list(sessionId);
  if (existingMessages.length === 0 && content && !session.title) {
    title(content, sessionId, directory);
  }

  // Build message parts array
  const messageParts: Array<{
    id: string;
    type: "text" | "file";
    text?: string;
    url?: string;
    mime?: string;
    filename?: string;
  }> = [];

  // Add text part
  const userTextPartId = randomID();
  messageParts.push({ id: userTextPartId, type: "text", text: content });

  // Add file parts (images, etc.) - generate IDs upfront for consistency
  const filePartsWithIds = fileParts.map((filePart) => ({
    ...filePart,
    id: filePart.id ?? randomID(),
  }));

  for (const filePart of filePartsWithIds) {
    messageParts.push({
      id: filePart.id,
      type: "file",
      url: filePart.url,
      mime: filePart.mime,
      filename: filePart.filename,
    });
  }

  // add user message with all parts
  const userMessage = messageStore.add(sessionId, {
    id: clientMessageId,
    sessionId,
    role: "user",
    parts: messageParts,
  });

  // emit user message so UI can display it
  events.emit(directory, {
    type: "message.updated",
    properties: {
      info: {
        id: userMessage.id,
        sessionID: sessionId,
        role: "user",
        time: { created: Date.now() },
        modelID: "",
        providerID: "",
        mode: "default",
        agent: "user",
        cost: 0,
        tokens: {
          input: 0,
          output: 0,
          reasoning: 0,
          cache: { read: 0, write: 0 },
        },
      },
    },
  });

  // emit user text part
  events.emit(directory, {
    type: "message.part.updated",
    properties: {
      part: {
        id: userTextPartId,
        sessionID: sessionId,
        messageID: userMessage.id,
        type: "text",
        text: content,
        seq: 0,
      },
    },
  });

  // emit file parts (images, PDFs, etc.)
  let seq = 1;
  for (const filePart of filePartsWithIds) {
    events.emit(directory, {
      type: "message.part.updated",
      properties: {
        part: {
          id: filePart.id,
          sessionID: sessionId,
          messageID: userMessage.id,
          type: "file",
          url: filePart.url,
          mime: filePart.mime,
          filename: filePart.filename,
          seq: seq++,
        },
      },
    });
  }

  // create assistant message (prefix with "msg_" + "~" to sort after user message)
  const assistantMessage = messageStore.add(sessionId, {
    id: `${userMessage.id}~${randomID()}`,
    sessionId,
    role: "assistant",
    parts: [],
  });

  // process in background, emit events to bus
  processMessage(
    kernl,
    sessionId,
    directory,
    assistantMessage.id,
    userMessage.id,
    content,
    filePartsWithIds,
    agentId,
    model,
  );

  // return immediately with the user message
  return cx.json(userMessage);
});

async function processMessage(
  kernl: Kernl,
  sessionId: string,
  directory: string,
  messageId: string,
  parentId: string,
  content: string,
  fileParts: Array<{
    id: string;
    url?: string;
    mime?: string;
    filename?: string;
  }>,
  agentId: string,
  overrideModel?: LanguageModel,
) {
  // Get agent from registry, fallback to codex
  const agent = kernl.agents.get(agentId) ?? kernl.agents.get("codex")!;
  // Use override model, or recreate agent's model with OAuth if available
  let model: LanguageModel | undefined = overrideModel;
  if (!model && agent.model) {
    // Check if OAuth is available for the agent's model provider
    const agentModelProvider = agent.model.provider;
    const auth = providerStore.getAuth(agentModelProvider);
    if (auth?.type === "oauth") {
      // Recreate model using createModel to get OAuth support
      model =
        createModel(agentModelProvider, agent.model.modelId) ?? agent.model;
    } else {
      model = agent.model;
    }
  }
  if (!model) {
    throw new Error("No model available");
  }
  let textPartId: string | null = null;
  let currentTextPartId: string | null = null; // Track for seq update after text.end
  let textContent = "";
  const toolArgs = new Map<string, Record<string, unknown>>(); // Track tool arguments by callId
  const messageCreatedAt = Date.now();

  const emit = (type: string, properties: unknown) => {
    events.emit(directory, { type, properties });
  };

  // emit session status as busy
  emit("session.status", { sessionID: sessionId, status: { type: "busy" } });

  // emit message.updated so UI knows the assistant message exists
  emit("message.updated", {
    info: {
      id: messageId,
      sessionID: sessionId,
      role: "assistant",
      time: { created: messageCreatedAt },
      parentID: parentId,
      modelID: model.modelId,
      providerID: model.provider,
      mode: "default",
      agent: agent.id,
      path: { cwd: directory, root: directory },
      cost: 0,
      tokens: {
        input: 0,
        output: 0,
        reasoning: 0,
        cache: { read: 0, write: 0 },
      },
    },
  });

  try {
    // Build input with text and file parts
    const inputContent: Array<
      | { kind: "text"; text: string }
      | { kind: "file"; mimeType: string; data: string; filename?: string }
    > = [{ kind: "text", text: content }];

    // Process file parts based on type
    for (const filePart of fileParts) {
      if (!filePart.url || !filePart.mime) continue;

      // Text files: use read tool to get content (like opencode does)
      if (
        filePart.mime === "text/plain" &&
        filePart.url.startsWith("file://")
      ) {
        try {
          const filepath = fileURLToPath(filePart.url);
          // Call the read tool - it returns formatted content with line numbers
          const result = await readTool.execute(null as any, {
            filePath: filepath,
          });
          inputContent.push({
            kind: "text",
            text: `Called the Read tool with the following input: ${JSON.stringify({ filePath: filepath })}\n\n${result}`,
          });
        } catch (e) {
          // If file read fails, add error message
          inputContent.push({
            kind: "text",
            text: `Failed to read file ${filePart.filename}: ${e instanceof Error ? e.message : String(e)}`,
          });
        }
        continue;
      }

      // Images and other binary files: send as base64 data
      const match = filePart.url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        inputContent.push({
          kind: "file",
          mimeType: filePart.mime,
          data: match[2], // base64 data
          filename: filePart.filename,
        });
      }
    }

    // Create user message with all content parts
    const input = [
      {
        kind: "message" as const,
        role: "user" as const,
        id: `msg_${randomID()}`,
        content: inputContent,
      },
    ];

    for await (const event of agent.stream(input, {
      model,
      threadId: sessionId,
      context: { sessionID: sessionId, directory },
    })) {
      switch (event.kind) {
        case "text.start":
          textPartId = randomID();
          currentTextPartId = textPartId;
          textContent = "";
          break;

        case "text.delta":
          if (textPartId) {
            textContent += event.text;
            emit("message.part.updated", {
              part: {
                id: textPartId,
                sessionID: sessionId,
                messageID: messageId,
                type: "text",
                text: textContent,
              },
            });
          }
          break;

        case "text.end":
          if (textPartId) {
            messageStore.updatePart(sessionId, messageId, {
              id: textPartId,
              type: "text",
              text: textContent,
            });
            textPartId = null;
          }
          break;

        case "tool.input.start":
          emit("message.part.updated", {
            part: {
              id: event.id,
              sessionID: sessionId,
              messageID: messageId,
              type: "tool",
              callID: event.id,
              tool: event.toolId,
              state: {
                status: "running",
                input: {},
                title: "Running...",
                metadata: {},
                time: { start: Date.now() },
              },
            },
          });
          break;

        case "tool.call": {
          const parsedArgs = JSON.parse(event.arguments || "{}");
          toolArgs.set(event.callId, parsedArgs);

          emit("message.part.updated", {
            part: {
              id: event.callId,
              sessionID: sessionId,
              messageID: messageId,
              type: "tool",
              callID: event.callId,
              tool: event.toolId,
              seq: event.seq,
              state: {
                status: "running",
                input: parsedArgs,
                title: event.toolId,
                metadata: {},
                time: { start: Date.now() },
              },
            },
          });
          break;
        }

        case "tool.result": {
          const input = toolArgs.get(event.callId) ?? {};
          toolArgs.delete(event.callId);

          // Handle structured results with diff/metadata
          const result = event.result;
          const isStructured =
            typeof result === "object" && result !== null && "text" in result;

          const output = isStructured
            ? (result as { text: string }).text
            : typeof result === "string"
              ? result
              : JSON.stringify(result);

          const diff = isStructured
            ? (result as { diff?: string }).diff
            : undefined;

          const resultMetadata = isStructured
            ? (result as { metadata?: Record<string, unknown> }).metadata
            : undefined;

          emit("message.part.updated", {
            part: {
              id: event.callId,
              sessionID: sessionId,
              messageID: messageId,
              type: "tool",
              callID: event.callId,
              tool: event.toolId,
              seq: event.seq,
              state: {
                status: "completed",
                input,
                output,
                title: event.toolId,
                metadata: {
                  output,
                  ...(diff && { diff }),
                  ...resultMetadata,
                },
                time: { start: Date.now(), end: Date.now() },
              },
            },
          });
          break;
        }

        case "message":
          // complete message with seq - update text part with final seq for ordering
          if (event.role === "assistant" && currentTextPartId) {
            emit("message.part.updated", {
              part: {
                id: currentTextPartId,
                sessionID: sessionId,
                messageID: messageId,
                type: "text",
                text: textContent,
                seq: event.seq,
              },
            });
            currentTextPartId = null; // Reset for next text block
          }
          break;

        case "finish": {
          // Extract usage from the finish event
          const usage = event.usage;
          const inputTokens = usage?.inputTokens?.total ?? 0;
          const outputTokens = usage?.outputTokens?.total ?? 0;
          const reasoningTokens = usage?.outputTokens?.reasoning ?? 0;
          const cachedInputTokens = usage?.inputTokens?.cacheRead ?? 0;
          const cachedWriteTokens = usage?.inputTokens?.cacheWrite ?? 0;

          // Emit final message.updated with actual token counts
          emit("message.updated", {
            info: {
              id: messageId,
              sessionID: sessionId,
              role: "assistant",
              time: { created: messageCreatedAt, completed: Date.now() },
              parentID: parentId,
              modelID: model.modelId,
              providerID: model.provider,
              mode: "default",
              agent: agent.id,
              path: { cwd: directory, root: directory },
              finish: event.finishReason?.unified ?? "stop",
              cost: 0, // TODO: calculate from model pricing if available
              tokens: {
                input: inputTokens,
                output: outputTokens,
                reasoning: reasoningTokens,
                cache: { read: cachedInputTokens, write: cachedWriteTokens },
              },
            },
          });
          break;
        }

        case "error": {
          // Handle error events from the stream - emit as session error
          const error = (event as any).error;
          const message = error?.message ?? String(error);
          const isAuthError =
            message.includes("API key") ||
            message.includes("authentication") ||
            message.includes("401") ||
            message.includes("invalid_api_key");

          emit("session.error", {
            sessionID: sessionId,
            error: isAuthError
              ? {
                  name: "ProviderAuthError",
                  data: { providerID: model.provider, message },
                }
              : {
                  name: "UnknownError",
                  data: { message },
                },
          });
          break;
        }
      }
    }
  } catch (err) {
    // Emit error event for UI to display (don't log - stdout bleeds to TUI)
    const message = err instanceof Error ? err.message : String(err);

    const isAuthError =
      message.includes("API key") ||
      message.includes("authentication") ||
      message.includes("401") ||
      message.includes("invalid_api_key");

    emit("session.error", {
      sessionID: sessionId,
      error: isAuthError
        ? {
            name: "ProviderAuthError",
            data: {
              providerID: model.provider,
              message,
            },
          }
        : {
            name: "UnknownError",
            data: { message },
          },
    });
  }

  emit("session.status", { sessionID: sessionId, status: { type: "idle" } });
}

/**
 * Abort message generation.
 */
sessions.post("/:id/abort", async (cx) => {
  const sessionId = cx.req.param("id");
  return cx.json({ aborted: true, sessionId });
});

/**
 * Get diff for a session.
 */
sessions.get("/:id/diff", async (cx) => {
  return cx.json([]);
});

/**
 * Get todo for a session.
 */
sessions.get("/:id/todo", async (cx) => {
  const sessionId = cx.req.param("id");
  return cx.json(todoStore.get(sessionId));
});
