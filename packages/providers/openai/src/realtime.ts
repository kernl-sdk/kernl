import { EventEmitter } from "node:events";
import WebSocket from "ws";

import type {
  RealtimeModel,
  RealtimeConnection,
  RealtimeConnectOptions,
  RealtimeClientEvent,
  TransportStatus,
} from "@kernl-sdk/protocol";

import { CLIENT_EVENT, SERVER_EVENT } from "./convert/event";
import type { OpenAIServerEvent } from "./convert/types";

const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime";

/**
 * Options for creating an OpenAI realtime model.
 */
export interface OpenAIRealtimeOptions {
  /**
   * OpenAI API key. Defaults to OPENAI_API_KEY env var.
   */
  apiKey?: string;

  /**
   * Base URL for the realtime API.
   */
  baseUrl?: string;
}

/**
 * OpenAI realtime model implementation.
 */
export class OpenAIRealtimeModel implements RealtimeModel {
  readonly spec = "1.0" as const;
  readonly provider = "openai";
  readonly modelId: string;

  private apiKey: string;
  private baseUrl: string;

  constructor(modelId: string, options?: OpenAIRealtimeOptions) {
    this.modelId = modelId;
    this.apiKey = options?.apiKey ?? process.env.OPENAI_API_KEY ?? "";
    this.baseUrl = options?.baseUrl ?? OPENAI_REALTIME_URL;

    if (!this.apiKey) {
      throw new Error("OpenAI API key is required");
    }
  }

  /**
   * Establish a WebSocket connection to the OpenAI realtime API.
   */
  async connect(options?: RealtimeConnectOptions): Promise<RealtimeConnection> {
    const url = `${this.baseUrl}?model=${this.modelId}`;

    const ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "OpenAI-Beta": "realtime=v1",
      },
    });

    const connection = new OpenAIRealtimeConnection(ws);

    await new Promise<void>((resolve, reject) => {
      if (options?.abort?.aborted) {
        return reject(new Error("Connection aborted"));
      }

      const cleanup = () => {
        ws.off("open", onOpen);
        ws.off("error", onError);
        options?.abort?.removeEventListener("abort", onAbort);
      };

      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = (err: Error) => {
        cleanup();
        reject(err);
      };
      const onAbort = () => {
        cleanup();
        ws.close();
        reject(new Error("Connection aborted"));
      };

      ws.on("open", onOpen);
      ws.on("error", onError);
      options?.abort?.addEventListener("abort", onAbort);
    });

    if (options?.sessionConfig) {
      connection.send({
        kind: "session.update",
        config: options.sessionConfig,
      });
    }

    return connection;
  }
}

/**
 * OpenAI realtime connection implementation.
 */
class OpenAIRealtimeConnection
  extends EventEmitter
  implements RealtimeConnection
{
  private ws: WebSocket;
  private _status: TransportStatus = "connecting";
  private _muted = false;
  private _sessionId: string | null = null;

  // audio state tracking for interruption
  private currid: string | undefined;
  private curridx: number | undefined;
  private faudtime: number | undefined; /* first audio timestamp */
  private audlenms: number = 0;
  private responding: boolean = false;

  constructor(socket: WebSocket) {
    super();
    this.ws = socket;

    socket.on("message", (data) => {
      try {
        const raw = JSON.parse(data.toString()) as OpenAIServerEvent;

        // track audio state for interruption handling
        if (raw.type === "response.output_audio.delta") {
          this.currid = raw.item_id;
          this.curridx = raw.content_index;
          if (this.faudtime === undefined) {
            this.faudtime = Date.now();
            this.audlenms = 0;
          }
          // calculate audio length assuming 24kHz PCM16
          // TODO: support g711 (8kHz, 1 byte/sample) and configurable PCM rates
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

        const event = SERVER_EVENT.decode(raw);
        if (event) {
          if (event.kind === "session.created") {
            this._sessionId = event.session.id;
          }
          this.emit("event", event);
        }
      } catch (err) {
        this.emit("error", err instanceof Error ? err : new Error(String(err)));
      }
    });

    socket.on("open", () => {
      this._status = "connected";
      this.emit("status", this._status);
    });

    socket.on("close", () => {
      this._status = "closed";
      this.reset();
      this.emit("status", this._status);
    });

    socket.on("error", (err) => {
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
   * Send a client event to the OpenAI realtime API.
   */
  send(event: RealtimeClientEvent): void {
    const encoded = CLIENT_EVENT.encode(event);
    if (encoded && this.ws.readyState === WebSocket.OPEN) {
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
   */
  interrupt(): void {
    // cancel ongoing response
    if (this.responding) {
      this.send({ kind: "response.cancel" });
      this.responding = false;
    }

    // truncate if we have audio state
    if (this.currid && this.faudtime !== undefined) {
      const elapsed = Date.now() - this.faudtime;
      const endms = Math.max(0, Math.floor(Math.min(elapsed, this.audlenms)));

      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: "conversation.item.truncate",
            item_id: this.currid,
            content_index: this.curridx ?? 0,
            audio_end_ms: endms,
          }),
        );
      }
    }

    this.reset();
  }

  /**
   * Reset audio tracking state.
   */
  private reset(): void {
    this.currid = undefined;
    this.curridx = undefined;
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
