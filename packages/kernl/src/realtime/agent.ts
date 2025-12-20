import type { RealtimeModel } from "@kernl-sdk/protocol";

import type { UnknownContext } from "@/context";
import { BaseAgent } from "@/agent/base";

import type { RealtimeAgentConfig, RealtimeAgentVoiceConfig } from "./types";

/**
 * A realtime agent definition.
 *
 * Stateless configuration that describes what a realtime voice agent does.
 * Create sessions with `new RealtimeSession(agent, options)`.
 */
export class RealtimeAgent<TContext = UnknownContext> extends BaseAgent<TContext> {
  readonly kind = "realtime";
  readonly model: RealtimeModel;
  readonly voice?: RealtimeAgentVoiceConfig;

  constructor(config: RealtimeAgentConfig<TContext>) {
    super(config);
    this.model = config.model;
    this.voice = config.voice;
  }
}
