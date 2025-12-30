import { useState, useEffect, useRef, useCallback } from "react";
import { RealtimeSession, RealtimeAgent, Context } from "kernl";
import type {
  RealtimeModel,
  RealtimeChannel,
  ClientCredential,
  TransportStatus,
} from "@kernl-sdk/protocol";

/**
 * Credential input that accepts expiresAt as either Date or string.
 * Derived from ClientCredential to stay in sync.
 */
type FlexibleExpiry<T> = T extends { expiresAt: Date }
  ? Omit<T, "expiresAt"> & { expiresAt: Date | string }
  : never;

export type CredentialInput = FlexibleExpiry<ClientCredential>;

/**
 * Options for the useRealtime hook.
 */
export interface UseRealtimeOptions<TContext> {
  /**
   * The realtime model to use.
   */
  model: RealtimeModel;

  /**
   * Audio I/O channel for mic capture and playback.
   */
  channel?: RealtimeChannel;

  /**
   * Context passed to tool executions.
   */
  ctx?: TContext;
}

/**
 * Return value from the useRealtime hook.
 */
export interface UseRealtimeReturn {
  /**
   * Current connection status.
   */
  status: TransportStatus;

  /**
   * Connect to the realtime model with the given credential.
   */
  connect: (credential: CredentialInput) => Promise<void>;

  /**
   * Disconnect from the realtime model.
   */
  disconnect: () => void;

  /**
   * Whether audio input is muted.
   */
  muted: boolean;

  /**
   * Mute audio input.
   */
  mute: () => void;

  /**
   * Unmute audio input.
   */
  unmute: () => void;

  /**
   * Send a text message to the model.
   */
  sendMessage: (text: string) => void;
}

/**
 * React hook for managing a realtime voice session.
 *
 * Handles connection lifecycle, status updates, and cleanup on unmount.
 *
 * @example
 * ```tsx
 * const { status, connect, disconnect } = useRealtime(agent, {
 *   model: openai.realtime("gpt-4o-realtime"),
 *   channel,
 *   ctx: { setCart },
 * });
 *
 * const start = async () => {
 *   const { credential } = await fetch("/api/credential").then(r => r.json());
 *   await channel.init();
 *   connect(credential);
 * };
 * ```
 */
export function useRealtime<TContext>(
  agent: RealtimeAgent<TContext>,
  options: UseRealtimeOptions<TContext>,
): UseRealtimeReturn {
  const [status, setStatus] = useState<TransportStatus>("disconnected");
  const [muted, setMuted] = useState(false);
  const sessionRef = useRef<RealtimeSession<TContext> | null>(null);

  const connect = useCallback(
    async (input: CredentialInput) => {
      if (sessionRef.current) return;

      // Convert expiresAt to Date if needed
      const expiresAt =
        typeof input.expiresAt === "string"
          ? new Date(input.expiresAt)
          : input.expiresAt;

      const credential: ClientCredential =
        input.kind === "token"
          ? { kind: "token", token: input.token, expiresAt }
          : { kind: "url", url: input.url, expiresAt };

      const session = new RealtimeSession(agent, {
        model: options.model,
        credential,
        channel: options.channel,
        context: options.ctx
          ? (new Context("react", options.ctx) as Context<TContext>)
          : undefined,
      });

      // Ignore events from sessions we've already disconnected from
      session.on("status", (s) => {
        if (sessionRef.current === session) {
          setStatus(s);
        }
      });
      sessionRef.current = session;
      await session.connect();
    },
    [agent, options.model, options.channel, options.ctx],
  );

  const disconnect = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    setStatus("disconnected");
    setMuted(false);
  }, []);

  const mute = useCallback(() => {
    sessionRef.current?.mute();
    setMuted(true);
  }, []);

  const unmute = useCallback(() => {
    sessionRef.current?.unmute();
    setMuted(false);
  }, []);

  const sendMessage = useCallback((text: string) => {
    sessionRef.current?.sendMessage(text);
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      sessionRef.current?.close();
    };
  }, []);

  return { status, connect, disconnect, muted, mute, unmute, sendMessage };
}
