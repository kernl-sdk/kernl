import { TypedEmitter } from "@kernl-sdk/shared";
import { SharedProviderOptions } from "@/provider";
import { LanguageModelTool } from "@/language-model";

/**
 * Events emitted by a realtime channel.
 */
export type RealtimeChannelEvents = {
  audio: [audio: string];
  commit: [];
  interrupt: [];
};

/**
 * Base interface for audio I/O channels.
 *
 * Channels bridge between audio sources (browser mic, Twilio, Discord)
 * and the realtime session. They handle audio capture/playback and emit
 * events that the session listens to.
 */
export interface RealtimeChannel extends TypedEmitter<RealtimeChannelEvents> {
  /**
   * Send audio to be played/transmitted by the channel.
   * Called by session when audio is received from the model.
   */
  sendAudio(audio: string): void;

  /**
   * Interrupt current audio playback.
   * Called by session when response is cancelled.
   */
  interrupt(): void;

  /**
   * Clean up resources and close the channel.
   */
  close(): void;
}

export interface RealtimeConnectOptions {
  /**
   * Initial session configuration.
   */
  sessionConfig?: RealtimeSessionConfig;

  /**
   * Resume a previous session.
   */
  resume?: SessionResumeConfig;

  /**
   * Abort signal for cancelling connection.
   */
  abort?: AbortSignal;

  /**
   * Provider-specific options.
   */
  providerOptions?: SharedProviderOptions;

  /**
   * Ephemeral credential for client-side connections.
   *
   * Obtained from model.authenticate() on the server.
   * When provided, used instead of the model's API key.
   */
  credential?: ClientCredential;

  /**
   * WebSocket constructor for browser/Node compatibility.
   *
   * Defaults to globalThis.WebSocket (available in browsers and Node 22+).
   * For Node.js <22, provide the 'ws' package.
   *
   * @example
   * ```ts
   * import WebSocket from 'ws';
   * await model.connect({ websocket: WebSocket });
   * ```
   */
  websocket?: WebSocketConstructor;
}

/**
 * WebSocket constructor type for cross-platform compatibility.
 */
export type WebSocketConstructor = new (
  url: string | URL,
  protocols?: string | string[],
) => WebSocketLike;

/**
 * Minimal WebSocket interface matching the standard WebSocket API.
 */
export interface WebSocketLike {
  readonly readyState: number;
  send(data: string | ArrayBuffer): void;
  close(code?: number, reason?: string): void;
  addEventListener(type: string, listener: (event: unknown) => void): void;
  removeEventListener(type: string, listener: (event: unknown) => void): void;
}

/**
 * Configuration for a realtime session.
 */
export interface RealtimeSessionConfig {
  /**
   * System instructions for the model.
   */
  instructions?: string;

  /**
   * Available tools the model can call.
   */
  tools?: LanguageModelTool[];

  /**
   * Tool choice behavior.
   */
  toolChoice?: RealtimeToolChoice;

  /**
   * Output modalities (text, audio, or both).
   */
  modalities?: RealtimeModality[];

  /**
   * Voice configuration for audio output.
   */
  voice?: VoiceConfig;

  /**
   * Audio format configuration.
   */
  audio?: AudioConfig;

  /**
   * Turn detection / VAD configuration.
   */
  turnDetection?: TurnDetectionConfig;

  /**
   * Provider-specific options.
   */
  providerOptions?: SharedProviderOptions;
}

/**
 * Output modality for realtime sessions.
 */
export type RealtimeModality = "text" | "audio";

/**
 * Tool choice behavior for realtime sessions.
 */
export type RealtimeToolChoice =
  | { kind: "auto" }
  | { kind: "none" }
  | { kind: "required" };

/**
 * Voice configuration for audio output.
 */
export interface VoiceConfig {
  /**
   * Voice ID (provider-specific).
   */
  voiceId: string;

  /**
   * Playback speed multiplier.
   */
  speed?: number;
}

/**
 * Audio format configuration for input and output.
 */
export interface AudioConfig {
  /**
   * Input audio format.
   */
  inputFormat?: AudioFormat;

  /**
   * Output audio format.
   */
  outputFormat?: AudioFormat;
}

/**
 * Audio format specification.
 */
export interface AudioFormat {
  /**
   * MIME type (e.g., "audio/pcm", "audio/wav").
   */
  mimeType: string;

  /**
   * Sample rate in Hz.
   */
  sampleRate?: number;

  /**
   * Bits per sample.
   */
  bitDepth?: number;

  /**
   * Number of channels.
   */
  channels?: number;
}

/**
 * Turn detection / VAD configuration.
 */
export interface TurnDetectionConfig {
  /**
   * Detection mode.
   */
  mode: "server_vad" | "manual";

  /**
   * VAD threshold (0-1).
   */
  threshold?: number;

  /**
   * Silence duration to trigger end of speech (ms).
   */
  silenceDurationMs?: number;

  /**
   * Audio to include before speech start (ms).
   */
  prefixPaddingMs?: number;

  /**
   * Auto-create response on speech end.
   */
  createResponse?: boolean;

  /**
   * Allow interruption of ongoing response.
   */
  interruptResponse?: boolean;
}

/**
 * Configuration for resuming a previous session.
 */
export interface SessionResumeConfig {
  /**
   * Handle from a previous session.
   */
  handle: string;
}

/**
 * Configuration for creating a response (for response.create event).
 */
export interface RealtimeResponseConfig {
  /**
   * Override session instructions for this response.
   */
  instructions?: string;

  /**
   * Override tools for this response.
   */
  tools?: LanguageModelTool[];

  /**
   * Override modalities for this response.
   */
  modalities?: RealtimeModality[];
}

/**
 * A realtime session as returned from the server.
 */
export interface RealtimeSession {
  /**
   * Unique session identifier.
   */
  id: string;

  /**
   * Current session configuration.
   */
  config: RealtimeSessionConfig;
}

/**
 * Error from a realtime session.
 */
export class RealtimeError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "RealtimeError";
    this.code = code;
    this.details = details;
  }
}

/**
 * Token usage information for a response.
 */
export interface RealtimeUsage {
  /**
   * Number of input tokens.
   */
  inputTokens?: number;

  /**
   * Number of output tokens.
   */
  outputTokens?: number;

  /**
   * Total number of tokens.
   */
  totalTokens?: number;
}

/**
 * Status of a response.
 */
export type ResponseStatus =
  | "completed"
  | "interrupted"
  | "cancelled"
  | "failed";

/**
 * Status of a realtime transport connection.
 */
export type TransportStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "closed";

/**
 * A client credential for browser-based realtime connections.
 *
 * Created server-side via model.authenticate(), passed to client
 * for secure connection without exposing API keys.
 */
export type ClientCredential =
  | {
      /** Ephemeral token for auth header (OpenAI style). */
      readonly kind: "token";
      token: string;
      expiresAt: Date;
    }
  | {
      /** Signed URL to connect directly (ElevenLabs style). */
      readonly kind: "url";
      url: string;
      expiresAt: Date;
    };

