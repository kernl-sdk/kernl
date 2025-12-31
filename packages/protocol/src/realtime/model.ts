import { TypedEmitter } from "@kernl-sdk/shared";

import { SharedProviderMetadata } from "@/provider";
import { RealtimeClientEvent, RealtimeServerEvent } from "./events";
import {
  RealtimeConnectOptions,
  RealtimeAuthenticateOptions,
  TransportStatus,
  ClientCredential,
} from "./types";

/**
 * Events emitted by a realtime connection.
 */
export type RealtimeConnectionEvents = {
  event: [event: RealtimeServerEvent];
  status: [status: TransportStatus];
  error: [error: Error];
  interrupted: [];
};

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

  /**
   * Create ephemeral credential for client-side connections.
   *
   * Call server-side where API key is available, pass result to client.
   * Client then uses credential in connect() options.
   *
   * @param options - Provider-specific options (e.g., agentId for ElevenLabs)
   */
  authenticate(
    options?: RealtimeAuthenticateOptions,
  ): Promise<ClientCredential>;
}

/**
 * An active bidirectional connection to a realtime model.
 *
 * One connection per session. Providers implement this interface.
 */
export interface RealtimeConnection
  extends TypedEmitter<RealtimeConnectionEvents> {
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
