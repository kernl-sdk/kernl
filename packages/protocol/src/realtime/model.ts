import { SharedProviderMetadata } from "@/provider";
import { RealtimeClientEvent, RealtimeServerEvent } from "./events";
import { RealtimeConnectOptions, TransportStatus } from "./types";

/**
 * A realtime model that can establish bidirectional streaming connections.
 *
 * Models are reusable - each call to connect() creates a new connection.
 * Providers implement this interface.
 */
export interface RealtimeModel {
  /**
   * The realtime model spec version.
   */
  readonly spec: "1.0";

  /**
   * Provider ID (e.g., "openai", "google", "elevenlabs").
   */
  readonly provider: string;

  /**
   * Model ID (e.g., "gpt-4o-realtime", "gemini-2.0-flash").
   */
  readonly modelId: string;

  /**
   * Establish a connection and return a connection instance.
   */
  connect(options?: RealtimeConnectOptions): Promise<RealtimeConnection>;
}

/**
 * An active bidirectional connection to a realtime model.
 *
 * One connection per session. Providers implement this interface.
 */
export interface RealtimeConnection {
  /**
   * Current connection status.
   */
  readonly status: TransportStatus;

  /**
   * Whether input audio is muted.
   * null if muting is not handled by the connection.
   */
  readonly muted: boolean | null;

  /**
   * Session ID once connected.
   */
  readonly sessionId: string | null;

  /**
   * Provider-specific metadata.
   */
  readonly providerMetadata?: SharedProviderMetadata;

  /**
   * Send a client event to the model.
   */
  send(event: RealtimeClientEvent): void;

  /**
   * Close the connection.
   */
  close(): void;

  /**
   * Mute input audio.
   */
  mute(): void;

  /**
   * Unmute input audio.
   */
  unmute(): void;

  /**
   * Interrupt the current response.
   * Convenience for sending response.cancel event.
   */
  interrupt(): void;

  // --- event subscription ---

  on(event: "event", listener: (event: RealtimeServerEvent) => void): this;
  on(event: "status", listener: (status: TransportStatus) => void): this;
  on(event: "error", listener: (error: Error) => void): this;

  off(event: "event", listener: (event: RealtimeServerEvent) => void): this;
  off(event: "status", listener: (status: TransportStatus) => void): this;
  off(event: "error", listener: (error: Error) => void): this;

  once(event: "event", listener: (event: RealtimeServerEvent) => void): this;
  once(event: "status", listener: (status: TransportStatus) => void): this;
  once(event: "error", listener: (error: Error) => void): this;
}

/**
 * A transport factory for custom connection mechanisms (e.g., WebRTC).
 *
 * Pass to RealtimeSession when you need to handle audio via media tracks
 * instead of base64 events.
 */
export interface RealtimeTransport {
  /**
   * Whether this transport handles audio I/O internally (e.g., WebRTC).
   * If true, cannot use a channel with this transport.
   */
  readonly handlesAudio: boolean;

  /**
   * Create a connection using this transport.
   */
  connect(
    model: RealtimeModel,
    options?: RealtimeConnectOptions,
  ): Promise<RealtimeConnection>;
}
