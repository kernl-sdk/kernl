import {
  RealtimeModel,
  RealtimeTransport,
  RealtimeConnectOptions,
} from "@kernl-sdk/protocol";

import { Context, UnknownContext } from "@/context";
import { BaseToolkit } from "@/tool";

import type { RealtimeChannel } from "./channel";

/**
 * Configuration for a realtime agent.
 */
export interface RealtimeAgentConfig<TContext = UnknownContext> {
  /**
   * Unique identifier for the agent.
   */
  id: string;

  /**
   * Display name for the agent.
   */
  name: string;

  /**
   * A brief description of the agent's purpose.
   */
  description?: string;

  /**
   * The instructions for the agent. Describes what the agent should do.
   *
   * Can be a static string or a function that dynamically generates instructions.
   */
  instructions:
    | string
    | ((context: Context<TContext>) => Promise<string> | string);

  /**
   * Toolkits available to the agent.
   */
  toolkits?: BaseToolkit<TContext>[];

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
   * The realtime model to connect to.
   */
  model: RealtimeModel;

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
   * Options passed to model.connect() or transport.connect().
   */
  connectOptions?: RealtimeConnectOptions;
}
