import { EventEmitter } from "node:events";

/**
 * Base interface for audio I/O channels.
 *
 * Channels bridge between audio sources (browser mic, Twilio, Discord)
 * and the realtime session. They handle audio capture/playback and emit
 * events that the session listens to.
 *
 * Events emitted:
 * - 'audio' (audio: string) - Raw audio chunk (base64)
 * - 'commit' () - User finished speaking (VAD or manual)
 * - 'interrupt' () - User started speaking mid-response
 */
export interface RealtimeChannel extends EventEmitter {
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
