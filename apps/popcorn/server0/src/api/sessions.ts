import { Hono } from "hono";
import { randomID } from "@kernl-sdk/shared/lib";
import type { Kernl } from "kernl";
import type { LanguageModel } from "@kernl-sdk/protocol";
import { fileURLToPath } from "node:url";

import * as todoStore from "@/state/todos";
import * as events from "@/state/events";
import * as providerStore from "@/state/providers";
import { titler } from "@/agents/titler";
import { createModel } from "@/lib/models";
import { read as readTool } from "@/toolkits/fs/read";
import { SessionCodec, type Session } from "@/lib/codecs/session";
import { MessageCodec } from "@/lib/codecs/message";
import { initSandbox } from "@/toolkits/daytona";

type Variables = { kernl: Kernl };

const aborts = new Map<string, AbortController>();

export const sessions = new Hono<{ Variables: Variables }>();

/**
 * List all sessions.
 */
sessions.get("/", async (cx) => {
  const kernl = cx.get("kernl");
  const page = await kernl.threads.list({ limit: 100 });
  const sessions: Session[] = [];
  for await (const thread of page) {
    sessions.push(SessionCodec.encode(thread));
  }
  return cx.json(sessions);
});

/**
 * Create a new session.
 * Note: Sessions are lazily created when the first message is sent.
 * This endpoint returns a placeholder session for compatibility.
 */
sessions.post("/", async (cx) => {
  const directory = cx.req.header("x-opencode-directory") ?? process.cwd();
  const body = await cx.req.json().catch(() => ({}));
  const now = Date.now();

  // Return a placeholder session - actual thread created on first message
  const session: Session = {
    id: body.id ?? `sid_${randomID()}`,
    projectID: "default",
    directory,
    title: "",
    version: "1",
    time: { created: now, updated: now },
  };
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
  const kernl = cx.get("kernl");
  const id = cx.req.param("id");
  const directory = cx.req.header("x-opencode-directory") ?? process.cwd();
  const thread = await kernl.threads.get(id);
  if (!thread) {
    // Thread not created yet - return placeholder so TUI can show live events
    const now = Date.now();
    return cx.json({
      id,
      projectID: "default",
      directory,
      title: "",
      version: "1",
      time: { created: now, updated: now },
    });
  }
  return cx.json(SessionCodec.encode(thread));
});

/**
 * Update a session.
 */
sessions.patch("/:id", async (cx) => {
  const kernl = cx.get("kernl");
  const id = cx.req.param("id");
  const body = await cx.req.json();

  const thread = await kernl.threads.update(id, {
    title: body.title,
  });
  if (!thread) {
    return cx.json({ error: "session not found" }, 404);
  }
  return cx.json(SessionCodec.encode(thread));
});

/**
 * Delete a session.
 */
sessions.delete("/:id", async (cx) => {
  const kernl = cx.get("kernl");
  const id = cx.req.param("id");
  const directory = cx.req.header("x-opencode-directory") ?? process.cwd();

  const thread = await kernl.threads.get(id);
  if (!thread) {
    return cx.json({ error: "session not found" }, 404);
  }

  await kernl.threads.delete(id);

  events.emit(directory, {
    type: "session.deleted",
    properties: { info: SessionCodec.encode(thread) },
  });

  return cx.json({ deleted: true, id });
});

/**
 * Get messages for a session.
 */
sessions.get("/:id/message", async (cx) => {
  const kernl = cx.get("kernl");
  const sessionId = cx.req.param("id");

  const thread = await kernl.threads.get(sessionId);
  if (!thread) {
    // Thread not created yet - return empty array so TUI can show live events
    return cx.json([]);
  }

  // Get thread history and convert to OpenCode messages
  const history = await kernl.threads.history(sessionId, { order: "asc" });
  const messages = MessageCodec.encode({ sessionId, events: history });

  // Transform to SDK expected format: Array<{ info: Message, parts: Part[] }>
  const transformed = messages.map((msg) => ({
    info: {
      id: msg.id,
      sessionID: msg.sessionId,
      role: msg.role,
      time: { created: new Date(msg.createdAt).getTime() },
      seq: msg.seq,
      mode: "default",
      agent: thread.agentId,
      modelID: thread.model.modelId,
      providerID: thread.model.provider,
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

  const body = await cx.req.json();
  const clientMessageId = body.messageID ?? `msg_${randomID()}`;
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

  // Generate title on first message (new thread)
  if (!existingThread && content) {
    title(kernl, content, sessionId, directory);
  }

  // Build message parts array for UI emission
  const messageParts: Array<{
    id: string;
    type: "text" | "file";
    text?: string;
    url?: string;
    mime?: string;
    filename?: string;
  }> = [];

  const userTextPartId = randomID();
  messageParts.push({ id: userTextPartId, type: "text", text: content });

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

  // Emit user message so UI can display it
  events.emit(directory, {
    type: "message.updated",
    properties: {
      info: {
        id: clientMessageId,
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

  // Emit user text part
  events.emit(directory, {
    type: "message.part.updated",
    properties: {
      part: {
        id: userTextPartId,
        sessionID: sessionId,
        messageID: clientMessageId,
        type: "text",
        text: content,
        seq: 0,
      },
    },
  });

  // Emit file parts
  let seq = 1;
  for (const filePart of filePartsWithIds) {
    events.emit(directory, {
      type: "message.part.updated",
      properties: {
        part: {
          id: filePart.id,
          sessionID: sessionId,
          messageID: clientMessageId,
          type: "file",
          url: filePart.url,
          mime: filePart.mime,
          filename: filePart.filename,
          seq: seq++,
        },
      },
    });
  }

  // Use deterministic suffix so history conversion produces matching IDs
  const assistantMessageId = `${clientMessageId}~response`;

  // Create abort controller for this session
  const controller = new AbortController();
  aborts.set(sessionId, controller);

  // Process in background, emit events to bus
  processMessage(
    kernl,
    sessionId,
    directory,
    assistantMessageId,
    clientMessageId,
    content,
    filePartsWithIds,
    agentId,
    model,
    controller.signal,
  );

  // Return immediately with the user message
  return cx.json({
    id: clientMessageId,
    sessionId,
    role: "user",
    createdAt: new Date().toISOString(),
    parts: messageParts,
  });
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
  signal?: AbortSignal,
) {
  const agent = kernl.agents.get(agentId) ?? kernl.agents.get("codex")!;

  let model: LanguageModel | undefined = overrideModel;
  if (!model && agent.model) {
    const agentModelProvider = agent.model.provider;
    const auth = providerStore.getAuth(agentModelProvider);
    if (auth?.type === "oauth") {
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
  let currentTextPartId: string | null = null;
  let textContent = "";
  const toolArgs = new Map<string, Record<string, unknown>>();
  const messageCreatedAt = Date.now();

  // Track per-message part ordering (not thread-global seq)
  let partSeq = 0;
  const partSeqMap = new Map<string, number>(); // partId -> assigned seq

  const emit = (type: string, properties: unknown) => {
    events.emit(directory, { type, properties });
  };

  emit("session.status", { sessionID: sessionId, status: { type: "busy" } });

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
    const inputContent: Array<
      | { kind: "text"; text: string }
      | { kind: "file"; mimeType: string; data: string; filename?: string }
    > = [{ kind: "text", text: content }];

    for (const filePart of fileParts) {
      if (!filePart.url || !filePart.mime) continue;

      if (
        filePart.mime === "text/plain" &&
        filePart.url.startsWith("file://")
      ) {
        try {
          const filepath = fileURLToPath(filePart.url);
          const result = await readTool.execute(null as any, {
            filePath: filepath,
          });
          inputContent.push({
            kind: "text",
            text: `Called the Read tool with the following input: ${JSON.stringify({ filePath: filepath })}\n\n${result}`,
          });
        } catch (e) {
          inputContent.push({
            kind: "text",
            text: `Failed to read file ${filePart.filename}: ${e instanceof Error ? e.message : String(e)}`,
          });
        }
        continue;
      }

      const match = filePart.url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        inputContent.push({
          kind: "file",
          mimeType: filePart.mime,
          data: match[2],
          filename: filePart.filename,
        });
      }
    }

    const input = [
      {
        kind: "message" as const,
        role: "user" as const,
        id: parentId, // Use clientMessageId so history matches live events
        content: inputContent,
      },
    ];

    // Start with existing thread context (if any) to preserve sandboxId etc.
    const existingThread = await kernl.threads.get(sessionId);
    const context: Record<string, unknown> = {
      ...(existingThread?.context ?? {}),
      sessionID: sessionId,
      directory,
    };
    if (agentId === "sandex") {
      if (process.env.GITHUB_TOKEN) {
        context.git = {
          username: "x-access-token",
          token: process.env.GITHUB_TOKEN,
        };
      }
      context.owner = "kernl-sdk";
      context.repo = "kernl";

      // Set up sandbox with kernl repo on new session
      if (!context.sandboxId) {
        const sandboxId = await initSandbox();
        context.sandboxId = sandboxId;
      }
    }

    for await (const event of agent.stream(input, {
      model,
      threadId: sessionId,
      context,
      abort: signal,
    })) {
      switch (event.kind) {
        case "text.start":
          textPartId = randomID();
          currentTextPartId = textPartId;
          textContent = "";
          // Assign seq when part is first created
          partSeqMap.set(textPartId, partSeq++);
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
                seq: partSeqMap.get(textPartId),
              },
            });
          }
          break;

        case "text.end":
          textPartId = null;
          break;

        case "tool.input.start":
          // Assign seq when part is first created
          partSeqMap.set(event.id, partSeq++);
          emit("message.part.updated", {
            part: {
              id: event.id,
              sessionID: sessionId,
              messageID: messageId,
              type: "tool",
              callID: event.id,
              tool: event.toolId,
              seq: partSeqMap.get(event.id),
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

          // Use existing seq if already assigned (from tool.input.start), otherwise assign new
          if (!partSeqMap.has(event.callId)) {
            partSeqMap.set(event.callId, partSeq++);
          }

          emit("message.part.updated", {
            part: {
              id: event.callId,
              sessionID: sessionId,
              messageID: messageId,
              type: "tool",
              callID: event.callId,
              tool: event.toolId,
              seq: partSeqMap.get(event.callId),
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
              seq: partSeqMap.get(event.callId),
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
          if (event.role === "user" && event.id === parentId) {
            // Emit user message seq now that kernl has assigned it
            // Only for current user message, not historical ones
            emit("message.updated", {
              info: {
                id: parentId,
                sessionID: sessionId,
                role: "user",
                time: { created: messageCreatedAt },
                seq: event.seq,
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
            });
          } else if (event.role === "assistant" && event.id === messageId) {
            // Only for current assistant message, not historical ones
            if (currentTextPartId) {
              emit("message.part.updated", {
                part: {
                  id: currentTextPartId,
                  sessionID: sessionId,
                  messageID: messageId,
                  type: "text",
                  text: textContent,
                  seq: partSeqMap.get(currentTextPartId),
                },
              });
              currentTextPartId = null;
            }
            // Emit message.updated with seq from kernl event
            emit("message.updated", {
              info: {
                id: messageId,
                sessionID: sessionId,
                role: "assistant",
                time: { created: messageCreatedAt },
                seq: event.seq,
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
          }
          break;

        case "finish": {
          const usage = event.usage;
          const inputTokens = usage?.inputTokens?.total ?? 0;
          const outputTokens = usage?.outputTokens?.total ?? 0;
          const reasoningTokens = usage?.outputTokens?.reasoning ?? 0;
          const cachedInputTokens = usage?.inputTokens?.cacheRead ?? 0;
          const cachedWriteTokens = usage?.inputTokens?.cacheWrite ?? 0;

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
              cost: 0,
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
  } finally {
    aborts.delete(sessionId);
    emit("session.status", { sessionID: sessionId, status: { type: "idle" } });
  }
}

/**
 * Abort message generation.
 */
sessions.post("/:id/abort", async (cx) => {
  const sessionId = cx.req.param("id");
  const controller = aborts.get(sessionId);
  if (controller) {
    controller.abort();
  }
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

/**
 * Generate session title asynchronously.
 */
async function title(
  kernl: Kernl,
  message: string,
  sessionId: string,
  directory: string,
): Promise<void> {
  let generatedTitle = "New Session";

  try {
    const res = await titler.run(`User message: ${message}`);
    generatedTitle = res.response.trim() || generatedTitle;
  } catch (err) {
    console.error("[sessions] titler error:", err);
  }

  const thread = await kernl.threads.update(sessionId, {
    title: generatedTitle,
  });
  if (thread) {
    events.emit(directory, {
      type: "session.updated",
      properties: { info: SessionCodec.encode(thread) },
    });
  }
}
