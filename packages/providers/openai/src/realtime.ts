import { Emitter } from "@kernl-sdk/shared";
import type {
  RealtimeModel,
  RealtimeConnection,
  RealtimeConnectionEvents,
  RealtimeConnectOptions,
  RealtimeClientEvent,
  TransportStatus,
  ClientCredential,
  WebSocketLike,
} from "@kernl-sdk/protocol";

import { CLIENT_EVENT, SERVER_EVENT } from "./convert/event";
import type { OpenAIServerEvent } from "./convert/types";

const OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime";
const OPENAI_CLIENT_SECRETS_URL =
  "https://api.openai.com/v1/realtime/client_secrets";

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

  private apiKey: string | null;
  private baseUrl: string;

  constructor(modelId: string, options?: OpenAIRealtimeOptions) {
    this.modelId = modelId;
    this.apiKey =
      options?.apiKey ??
      (typeof process !== "undefined" ? process.env?.OPENAI_API_KEY : null) ??
      null;
    this.baseUrl = options?.baseUrl ?? OPENAI_REALTIME_URL;
  }

  /**
   * Create ephemeral credential for client-side connections.
   *
   * Must be called server-side where API key is available.
   */
  async authenticate(): Promise<ClientCredential> {
    if (!this.apiKey) {
      throw new Error(
        "API key required for authenticate(). " +
          "Call this server-side where OPENAI_API_KEY is available.",
      );
    }

    const res = await fetch(OPENAI_CLIENT_SECRETS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: { type: "realtime", model: this.modelId },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to create credential: ${res.status} ${text}`);
    }

    const data = (await res.json()) as { value: string };
    return {
      kind: "token",
      token: data.value,
      expiresAt: new Date(Date.now() + 60_000), // ~60s TTL
    };
  }

  /**
   * Establish a WebSocket connection to the OpenAI realtime API.
   */
  async connect(options?: RealtimeConnectOptions): Promise<RealtimeConnection> {
    const credential = options?.credential;

    if (credential && credential.kind !== "token") {
      throw new Error(
        `OpenAI requires token credentials, got "${credential.kind}".`,
      );
    }

    const authToken = credential?.token ?? this.apiKey;

    if (!authToken) {
      throw new Error(
        "No API key or credential provided. " +
          "Either set OPENAI_API_KEY or pass a credential from authenticate().",
      );
    }

    // Use injectable WebSocket or globalThis.WebSocket
    const WS = options?.websocket ?? globalThis.WebSocket;
    if (!WS) {
      throw new Error(
        "No WebSocket available. In Node.js <22, use WebSocketTransport with the 'ws' package:\n" +
          "  import WebSocket from 'ws';\n" +
          "  import { WebSocketTransport } from 'kernl';\n" +
          "  new RealtimeSession(agent, { transport: new WebSocketTransport({ websocket: WebSocket }), ... })",
      );
    }

    const url = `${this.baseUrl}?model=${this.modelId}`;

    // Use subprotocol auth (works in browsers and Node)
    // Note: Don't include openai-beta.realtime-v1 when using ephemeral tokens -
    // the version is encoded in the token itself
    const protocols = ["realtime", `openai-insecure-api-key.${authToken}`];
    const ws = new WS(url, protocols);

    const connection = new OpenAIRealtimeConnection(ws);

    await new Promise<void>((resolve, reject) => {
      if (options?.abort?.aborted) {
        return reject(new Error("Connection aborted"));
      }

      const onOpen = () => {
        cleanup();
        resolve();
      };
      const onError = (event: unknown) => {
        cleanup();
        const err =
          event instanceof Error
            ? event
            : new Error("WebSocket connection failed");
        reject(err);
      };
      const onAbort = () => {
        cleanup();
        ws.close();
        reject(new Error("Connection aborted"));
      };

      const cleanup = () => {
        ws.removeEventListener("open", onOpen);
        ws.removeEventListener("error", onError);
        options?.abort?.removeEventListener("abort", onAbort);
      };

      ws.addEventListener("open", onOpen);
      ws.addEventListener("error", onError);
      options?.abort?.addEventListener("abort", onAbort);
    });

    return connection;
  }
}

// WebSocket readyState constants
const WS_OPEN = 1;

/**
 * OpenAI realtime connection implementation.
 */
class OpenAIRealtimeConnection
  extends Emitter<RealtimeConnectionEvents>
  implements RealtimeConnection
{
  private ws: WebSocketLike;
  private _status: TransportStatus = "connecting";
  private _muted = false;
  private _sessionId: string | null = null;

  // audio state tracking for interruption
  private currid: string | undefined;
  private curridx: number | undefined;
  private faudtime: number | undefined; /* first audio timestamp */
  private audlenms: number = 0;
  private responding: boolean = false;

  constructor(socket: WebSocketLike) {
    super();
    this.ws = socket;

    socket.addEventListener("message", (event: unknown) => {
      try {
        // Browser sends MessageEvent with data property
        const data =
          event && typeof event === "object" && "data" in event
            ? (event as { data: string }).data
            : String(event);
        const raw = JSON.parse(data) as OpenAIServerEvent;

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
   * Send a client event to the OpenAI realtime API.
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

      if (this.ws.readyState === WS_OPEN) {
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

    this.emit("interrupted");
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
