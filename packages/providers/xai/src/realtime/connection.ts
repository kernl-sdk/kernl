import { Emitter } from "@kernl-sdk/shared";
import {
  WS_OPEN,
  type RealtimeConnection,
  type RealtimeConnectionEvents,
  type RealtimeClientEvent,
  type TransportStatus,
  type WebSocketLike,
} from "@kernl-sdk/protocol";

import type { GrokServerEvent } from "./protocol";
import { CLIENT_EVENT, SERVER_EVENT } from "./convert/event";

/**
 * Grok realtime connection implementation.
 */
export class GrokRealtimeConnection
  extends Emitter<RealtimeConnectionEvents>
  implements RealtimeConnection
{
  private ws: WebSocketLike;
  private _status: TransportStatus = "connecting";
  private _muted = false;
  private _sessionId: string | null = null;

  // audio state tracking for interruption
  private currid: string | undefined;
  private faudtime: number | undefined;
  private audlenms: number = 0;
  private responding: boolean = false;

  constructor(socket: WebSocketLike) {
    super();
    this.ws = socket;

    socket.addEventListener("message", (event: unknown) => {
      try {
        const data =
          event && typeof event === "object" && "data" in event
            ? (event as { data: string }).data
            : String(event);
        const raw = JSON.parse(data) as GrokServerEvent;

        // track audio state for interruption handling
        if (raw.type === "response.output_audio.delta") {
          this.currid = raw.item_id;
          if (this.faudtime === undefined) {
            this.faudtime = Date.now();
            this.audlenms = 0;
          }
          // calculate audio length assuming 24kHz PCM16
          const bytes = base64ByteLength(raw.delta);
          this.audlenms += (bytes / 2 / 24000) * 1000;
        } else if (raw.type === "response.created") {
          this.responding = true;
        } else if (raw.type === "response.done") {
          this.responding = false;
          this.reset();
        } else if (raw.type === "input_audio_buffer.speech_started") {
          this.interrupt();
        }

        const event_ = SERVER_EVENT.decode(raw);
        if (event_) {
          if (event_.kind === "session.created") {
            this._sessionId = event_.session.id;
          }
          this.emit("event", event_);
        }
      } catch (err) {
        this.emit("error", err instanceof Error ? err : new Error(String(err)));
      }
    });

    socket.addEventListener("open", () => {
      this._status = "connected";
      this.emit("status", this._status);
    });

    socket.addEventListener("close", () => {
      this._status = "closed";
      this.reset();
      this.emit("status", this._status);
    });

    socket.addEventListener("error", (event: unknown) => {
      const err = event instanceof Error ? event : new Error("WebSocket error");
      this.emit("error", err);
    });
  }

  get status(): TransportStatus {
    return this._status;
  }

  get muted(): boolean {
    return this._muted;
  }

  get sessionId(): string | null {
    return this._sessionId;
  }

  /**
   * Send a client event to the Grok realtime API.
   */
  send(event: RealtimeClientEvent): void {
    const encoded = CLIENT_EVENT.encode(event);
    if (encoded && this.ws.readyState === WS_OPEN) {
      this.ws.send(JSON.stringify(encoded));
    }
  }

  /**
   * Close the WebSocket connection.
   */
  close(): void {
    this.reset();
    this.ws.close();
  }

  /**
   * Mute audio input.
   */
  mute(): void {
    this._muted = true;
  }

  /**
   * Unmute audio input.
   */
  unmute(): void {
    this._muted = false;
  }

  /**
   * Interrupt the current response.
   *
   * Note: Grok doesn't support response.cancel or item.truncate,
   * so we just reset local state and emit the interrupted event.
   */
  interrupt(): void {
    if (this.responding) {
      this.responding = false;
    }

    this.emit("interrupted");
    this.reset();
  }

  /**
   * Reset audio tracking state.
   */
  private reset(): void {
    this.currid = undefined;
    this.faudtime = undefined;
    this.audlenms = 0;
  }
}

/**
 * Get byte length from base64 string without decoding.
 */
function base64ByteLength(b64: string): number {
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return (b64.length * 3) / 4 - padding;
}
