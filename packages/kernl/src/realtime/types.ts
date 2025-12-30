import {
  RealtimeModel,
  RealtimeTransport,
  RealtimeConnectOptions,
  RealtimeChannel,
  ClientCredential,
} from "@kernl-sdk/protocol";

import { Context, UnknownContext } from "@/context";
import type { BaseAgentConfig } from "@/agent/base";

/**
 * Configuration for a realtime agent.
 */
export interface RealtimeAgentConfig<TContext = UnknownContext>
  extends BaseAgentConfig<TContext> {
  /**
   * The realtime model to use for this agent.
   */
  model: RealtimeModel;

  /**
   * Voice configuration for the agent.
   */
  voice?: RealtimeAgentVoiceConfig;
}

/**
 * Voice configuration for a realtime agent.
 */
export interface RealtimeAgentVoiceConfig {
  /**
   * Voice ID to use for audio output.
   */
  voiceId: string;

  /**
   * Playback speed multiplier.
   */
  speed?: number;
}

/**
 * Options for creating a realtime session.
 */
export interface RealtimeSessionOptions<TContext = UnknownContext> {
  /**
   * Override the agent's default model for this session.
   */
  model?: RealtimeModel;

  /**
   * Audio I/O channel (e.g., BrowserChannel, TwilioChannel).
   * Not used with WebRTC transport.
   */
  channel?: RealtimeChannel;

  /**
   * Custom transport (e.g., WebRTCTransport).
   * If not provided, model.connect() creates the default transport.
   */
  transport?: RealtimeTransport;

  /**
   * Context for this session.
   */
  context?: Context<TContext>;

  /**
   * Ephemeral credential for client-side connections.
   *
   * Obtained from model.authenticate() on the server.
   * Shorthand for connectOptions.credential.
   */
  credential?: ClientCredential;

  /**
   * Options passed to model.connect() or transport.connect().
   */
  connectOptions?: RealtimeConnectOptions;
}
