import { SharedProviderOptions } from "@/provider";
import { LanguageModelTool } from "@/language-model";

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
export interface RealtimeError {
  /**
   * Error code.
   */
  code: string;

  /**
   * Human-readable error message.
   */
  message: string;

  /**
   * Additional error details.
   */
  details?: Record<string, unknown>;
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
