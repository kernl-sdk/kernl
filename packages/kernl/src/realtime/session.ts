import { Emitter } from "@kernl-sdk/shared";
import {
  RealtimeModel,
  RealtimeConnection,
  RealtimeServerEvent,
  RealtimeSessionConfig,
  RealtimeChannel,
  ToolCallEvent,
  TransportStatus,
  message,
} from "@kernl-sdk/protocol";

import { Context, UnknownContext } from "@/context";
import { MisconfiguredError } from "@/lib/error";

import { RealtimeAgent } from "./agent";
import type { RealtimeSessionOptions } from "./types";

/**
 * Events emitted by a realtime session.
 */
export type RealtimeSessionEvents = {
  audio: [event: RealtimeServerEvent];
  transcript: [event: RealtimeServerEvent];
  text: [event: RealtimeServerEvent];
  error: [error: Error];
  status: [status: TransportStatus];
};

/**
 * A realtime session manages the connection to a realtime model.
 *
 * Handles the bidirectional communication between an agent and a model,
 * including audio I/O (via channels), tool execution, and event routing.
 */
export class RealtimeSession<
  TContext = UnknownContext,
> extends Emitter<RealtimeSessionEvents> {
  /**
   * Session ID. Null until connected.
   */
  id: string | null = null;

  /**
   * The agent definition.
   */
  readonly agent: RealtimeAgent<TContext>;

  /**
   * The realtime model.
   */
  readonly model: RealtimeModel;

  /**
   * The audio I/O channel (if any).
   */
  readonly channel: RealtimeChannel | null;

  /**
   * The session context.
   */
  readonly context: Context<TContext>;

  /**
   * The active connection. Null until connected.
   */
  private connection: RealtimeConnection | null = null;

  /**
   * Session options.
   */
  private options: RealtimeSessionOptions<TContext>;

  constructor(
    agent: RealtimeAgent<TContext>,
    options: RealtimeSessionOptions<TContext> = {},
  ) {
    super();

    if (options.transport?.handlesAudio && options.channel) {
      throw new MisconfiguredError(
        "Cannot use channel with WebRTC transport - audio is handled by transport",
      );
    }

    this.agent = agent;
    this.model = options.model ?? agent.model;
    this.channel = options.channel ?? null;
    this.context = options.context ?? new Context("kernl", {} as TContext);
    this.options = options;
  }

  /**
   * Connect to the realtime model.
   */
  async connect(): Promise<void> {
    const sessionConfig = await this.buildSessionConfig();
    const options = {
      ...this.options.connectOptions,
      sessionConfig,
      credential:
        this.options.credential ?? this.options.connectOptions?.credential,
    };

    this.connection = this.options.transport
      ? await this.options.transport.connect(this.model, options)
      : await this.model.connect(options);

    this.connection.on("event", this.onEvent.bind(this));
    this.connection.on("error", (e) => this.emit("error", e));
    this.connection.on("status", (s) => this.emit("status", s));
    this.connection.on("interrupted", () => this.channel?.interrupt());

    // Emit current status (may have been set before listeners attached)
    this.emit("status", this.connection.status);

    this.init();
  }

  /**
   * Initialize event listeners and send session configuration.
   */
  private async init(): Promise<void> {
    if (this.channel) {
      this.channel.on("audio", (audio: string) => this.sendAudio(audio));
      this.channel.on("commit", () => this.commit());
      this.channel.on("interrupt", () => this.interrupt());
    }

    this.connection?.send({
      kind: "session.update",
      config: await this.buildSessionConfig(),
    });
  }

  /**
   * Send audio to the model.
   */
  sendAudio(audio: string): void {
    this.connection?.send({ kind: "audio.input.append", audio });
  }

  /**
   * Commit the audio buffer (signal end of speech).
   */
  commit(): void {
    this.connection?.send({ kind: "audio.input.commit" });
  }

  /**
   * Send a text message to the model.
   */
  sendMessage(text: string): void {
    this.connection?.send({
      kind: "item.create",
      item: message({ role: "user", text }),
    });
  }

  /**
   * Interrupt the current response.
   */
  interrupt(): void {
    this.connection?.send({ kind: "response.cancel" });
    this.channel?.interrupt();
  }

  /**
   * Mute audio input.
   */
  mute(): void {
    this.connection?.mute();
  }

  /**
   * Unmute audio input.
   */
  unmute(): void {
    this.connection?.unmute();
  }

  /**
   * Close the session and release resources.
   */
  close(): void {
    this.channel?.close();
    this.connection?.close();
  }

  /**
   * Build session configuration from agent.
   */
  private async buildSessionConfig(): Promise<RealtimeSessionConfig> {
    const tools = await this.agent.tools(this.context);

    return {
      instructions: await this.agent.instructions(this.context),
      tools: tools.map((t) => t.serialize()),
      voice: this.agent.voice,
      turnDetection: { mode: "server_vad" },
      audio: {
        inputFormat: { mimeType: "audio/pcm", sampleRate: 24000 },
        outputFormat: { mimeType: "audio/pcm", sampleRate: 24000 },
      },
    };
  }

  /**
   * Handle incoming events from the connection.
   *
   * Maps protocol events to simplified user-facing events:
   * - 'audio' - audio output from assistant
   * - 'transcript' - speech transcriptions (user or assistant)
   * - 'text' - text output from assistant
   * - 'error' - errors
   */
  private onEvent(event: RealtimeServerEvent): void {
    switch (event.kind) {
      // audio output → 'audio'
      case "audio.output.delta":
        this.channel?.sendAudio(event.audio);
        this.emit("audio", event);
        break;
      case "audio.output.done":
        this.emit("audio", event);
        break;

      // speech transcriptions → 'transcript'
      case "transcript.input":
      case "transcript.output":
        this.emit("transcript", event);
        break;

      // text output → 'text'
      case "text.output":
        this.emit("text", event);
        break;

      // ERrors → 'error'
      case "session.error":
        this.emit("error", event.error);
        break;

      // tool calls - handled internally
      case "tool.call":
        this.performActions(event);
        break;

      // session lifecycle - internal state
      case "session.created":
        this.id = event.session.id;
        break;
    }
  }

  /**
   * Execute tool calls from the model.
   */
  private async performActions(event: ToolCallEvent): Promise<void> {
    const tool = this.agent.tool(event.toolId);
    if (!tool || tool.type !== "function") {
      this.connection?.send({
        kind: "tool.result",
        callId: event.callId,
        error: `Unknown tool: ${event.toolId}`,
      });
      return;
    }

    const result = await tool.invoke(
      this.context,
      event.arguments,
      event.callId,
    );

    this.connection?.send({
      kind: "tool.result",
      callId: event.callId,
      result: result.state === "completed" ? String(result.result) : undefined,
      error: result.error ?? undefined,
    });
  }
}
