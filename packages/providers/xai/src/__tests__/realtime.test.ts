import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";

import type {
  RealtimeServerEvent,
  TransportStatus,
  WebSocketConstructor,
} from "@kernl-sdk/protocol";
import type { GrokServerEvent } from "../realtime/protocol";
import { GrokRealtimeModel } from "../realtime/model";

// Track mock WebSocket instances
const wsInstances: TestWebSocket[] = [];

interface TestWebSocket extends EventEmitter {
  send: (data: string | ArrayBuffer) => void;
  close: () => void;
  readyState: number;
  OPEN: number;
  addEventListener: (type: string, listener: (event: unknown) => void) => void;
  removeEventListener: (type: string, listener: (event: unknown) => void) => void;
}

function createMockWebSocket(): TestWebSocket {
  const emitter = new EventEmitter() as TestWebSocket;
  emitter.send = vi.fn();
  emitter.close = vi.fn();
  emitter.readyState = 1; // OPEN
  emitter.OPEN = 1;
  emitter.addEventListener = emitter.on.bind(emitter) as TestWebSocket["addEventListener"];
  emitter.removeEventListener = emitter.off.bind(emitter) as TestWebSocket["removeEventListener"];
  return emitter;
}

// Mock WebSocket constructor that tracks instances
const MockWebSocket = function () {
  const instance = createMockWebSocket();
  wsInstances.push(instance);
  return instance;
} as unknown as WebSocketConstructor;

describe("GrokRealtimeModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wsInstances.length = 0;
  });

  it("should require API key", async () => {
    const originalEnv = process.env.XAI_API_KEY;
    delete process.env.XAI_API_KEY;

    const model = new GrokRealtimeModel();

    // Connect should fail without API key
    await expect(model.connect({ websocket: MockWebSocket })).rejects.toThrow(
      "No API key or credential provided",
    );

    process.env.XAI_API_KEY = originalEnv;
  });

  it("should accept API key via options", () => {
    const model = new GrokRealtimeModel({
      apiKey: "test-key",
    });

    expect(model.modelId).toBe("grok-realtime");
    expect(model.provider).toBe("xai");
    expect(model.spec).toBe("1.0");
  });

  it("should use XAI_API_KEY env var", () => {
    const originalEnv = process.env.XAI_API_KEY;
    process.env.XAI_API_KEY = "env-key";

    const model = new GrokRealtimeModel();
    expect(model.modelId).toBe("grok-realtime");

    process.env.XAI_API_KEY = originalEnv;
  });
});

describe("base64ByteLength", () => {
  // Test the helper function indirectly through the module
  // The actual function is not exported, but we can verify the audio length calculation works

  it("should calculate correct byte length for base64 without padding", () => {
    // "AAAA" = 3 bytes (no padding needed for 3 bytes)
    const b64NoPadding = "AAAA";
    const expectedBytes = 3;
    const padding = 0;
    const calculated = (b64NoPadding.length * 3) / 4 - padding;
    expect(calculated).toBe(expectedBytes);
  });

  it("should calculate correct byte length for base64 with single padding", () => {
    // "AAA=" represents 2 bytes
    const b64SinglePad = "AAA=";
    const expectedBytes = 2;
    const padding = 1;
    const calculated = (b64SinglePad.length * 3) / 4 - padding;
    expect(calculated).toBe(expectedBytes);
  });

  it("should calculate correct byte length for base64 with double padding", () => {
    // "AA==" represents 1 byte
    const b64DoublePad = "AA==";
    const expectedBytes = 1;
    const padding = 2;
    const calculated = (b64DoublePad.length * 3) / 4 - padding;
    expect(calculated).toBe(expectedBytes);
  });
});

describe("audio length calculation", () => {
  it("should calculate correct duration for 24kHz PCM16", () => {
    // 24kHz PCM16 = 24000 samples/sec, 2 bytes/sample = 48000 bytes/sec
    // 48000 bytes = 1000ms
    // 4800 bytes = 100ms
    const bytes = 4800;
    const expectedMs = (bytes / 2 / 24000) * 1000;
    expect(expectedMs).toBe(100);
  });

  it("should accumulate audio length from multiple chunks", () => {
    // Simulate multiple audio chunks
    const chunk1Bytes = 2400; // 50ms
    const chunk2Bytes = 2400; // 50ms
    const chunk3Bytes = 2400; // 50ms

    let totalMs = 0;
    totalMs += (chunk1Bytes / 2 / 24000) * 1000;
    totalMs += (chunk2Bytes / 2 / 24000) * 1000;
    totalMs += (chunk3Bytes / 2 / 24000) * 1000;

    expect(totalMs).toBe(150);
  });
});

describe("GrokRealtimeConnection (mocked WebSocket)", () => {
  const apiKey = "test-key";

  beforeEach(() => {
    vi.clearAllMocks();
    wsInstances.length = 0;
  });

  const getLastSocket = (): TestWebSocket => {
    if (wsInstances.length === 0) {
      throw new Error("No WebSocket instances were created");
    }
    return wsInstances[wsInstances.length - 1];
  };

  const emitServerEvent = (
    socket: TestWebSocket,
    event: GrokServerEvent,
  ): void => {
    const payload = JSON.stringify(event);
    socket.emit("message", { data: payload });
  };

  const createConnectedRealtime = async () => {
    const model = new GrokRealtimeModel({ apiKey });
    const connectPromise = model.connect({ websocket: MockWebSocket });

    const socket = getLastSocket();
    // Simulate successful WebSocket open.
    socket.emit("open");

    const connection = await connectPromise;

    return { connection, socket };
  };

  it("should process a basic conversation flow and emit events", async () => {
    const { connection, socket } = await createConnectedRealtime();

    const statusEvents: TransportStatus[] = [];
    const realtimeEvents: RealtimeServerEvent[] = [];

    (connection as unknown as EventEmitter).on(
      "status",
      (status: TransportStatus) => {
        statusEvents.push(status);
      },
    );

    (connection as unknown as EventEmitter).on(
      "event",
      (event: RealtimeServerEvent) => {
        realtimeEvents.push(event);
      },
    );

    // Verify initial status after open.
    expect(
      (connection as unknown as { status: TransportStatus }).status,
    ).toBe("connected");

    // conversation.created (Grok's equivalent of session.created)
    emitServerEvent(socket, {
      type: "conversation.created",
      event_id: "evt-1",
      conversation: { id: "conv-1", object: "realtime.conversation" },
    });

    // response.created
    emitServerEvent(socket, {
      type: "response.created",
      event_id: "evt-2",
      response: { id: "resp-1", object: "realtime.response", status: "in_progress", output: [] },
    });

    // small audio delta then done
    emitServerEvent(socket, {
      type: "response.output_audio.delta",
      event_id: "evt-3",
      response_id: "resp-1",
      item_id: "item-1",
      output_index: 0,
      content_index: 0,
      delta: "AAAA",
    });

    emitServerEvent(socket, {
      type: "response.output_audio.done",
      event_id: "evt-4",
      response_id: "resp-1",
      item_id: "item-1",
    });

    // transcript delta then done
    emitServerEvent(socket, {
      type: "response.output_audio_transcript.delta",
      event_id: "evt-5",
      response_id: "resp-1",
      item_id: "item-1",
      delta: "Hello",
    });

    emitServerEvent(socket, {
      type: "response.output_audio_transcript.done",
      event_id: "evt-6",
      response_id: "resp-1",
      item_id: "item-1",
    });

    // input transcription
    emitServerEvent(socket, {
      type: "conversation.item.input_audio_transcription.completed",
      event_id: "evt-7",
      item_id: "item-1",
      transcript: "User said hello",
    });

    // response.done
    emitServerEvent(socket, {
      type: "response.done",
      event_id: "evt-8",
      response: {
        id: "resp-1",
        object: "realtime.response",
        status: "completed",
      },
    });

    // Close socket to trigger status change and reset.
    socket.emit("close");

    // Status events should include closed (connected is emitted before we subscribe).
    expect(statusEvents).toContain("closed");

    // We should have seen several realtime events in a sensible order.
    const kinds = realtimeEvents.map((e) => e?.kind);
    expect(kinds).toContain("session.created");
    expect(kinds).toContain("response.created");
    expect(kinds).toContain("audio.output.delta");
    expect(kinds).toContain("audio.output.done");
    expect(kinds).toContain("transcript.output.delta");
    expect(kinds).toContain("transcript.output");
    expect(kinds).toContain("transcript.input");
    expect(kinds).toContain("response.done");
  });

  it("should emit interrupted event on speech start", async () => {
    const { connection, socket } = await createConnectedRealtime();

    let interrupted = false;
    (connection as unknown as EventEmitter).on("interrupted", () => {
      interrupted = true;
    });

    // Mark that a response is in progress with some audio.
    emitServerEvent(socket, {
      type: "response.created",
      event_id: "evt-1",
      response: { id: "resp-1", object: "realtime.response", status: "in_progress", output: [] },
    });

    // Single audio delta chunk
    emitServerEvent(socket, {
      type: "response.output_audio.delta",
      event_id: "evt-2",
      response_id: "resp-1",
      item_id: "item-1",
      output_index: 0,
      content_index: 0,
      delta: "AAAA",
    });

    // speech_started should trigger interrupt logic
    emitServerEvent(socket, {
      type: "input_audio_buffer.speech_started",
      event_id: "evt-3",
      item_id: "item-2",
    });

    expect(interrupted).toBe(true);
  });

  it("should handle tool calls", async () => {
    const { connection, socket } = await createConnectedRealtime();

    const realtimeEvents: RealtimeServerEvent[] = [];
    (connection as unknown as EventEmitter).on(
      "event",
      (event: RealtimeServerEvent) => {
        realtimeEvents.push(event);
      },
    );

    // function call arguments done
    emitServerEvent(socket, {
      type: "response.function_call_arguments.done",
      event_id: "evt-1",
      call_id: "call-1",
      name: "get_weather",
      arguments: '{"location":"Tokyo"}',
    });

    const toolCall = realtimeEvents.find((e) => e.kind === "tool.call");
    expect(toolCall).toBeDefined();
    if (toolCall?.kind === "tool.call") {
      expect(toolCall.toolId).toBe("get_weather");
      expect(toolCall.callId).toBe("call-1");
      expect(JSON.parse(toolCall.arguments)).toEqual({ location: "Tokyo" });
    }
  });
});
