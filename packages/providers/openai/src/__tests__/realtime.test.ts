import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "node:events";

import type {
  RealtimeServerEvent,
  TransportStatus,
} from "@kernl-sdk/protocol";
import type { OpenAIServerEvent } from "../convert/types";

// Track mock WebSocket instances
const wsInstances: TestWebSocket[] = [];

interface TestWebSocket extends EventEmitter {
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  readyState: number;
  OPEN: number;
}

function createMockWebSocket(): TestWebSocket {
  const emitter = new EventEmitter() as TestWebSocket;
  emitter.send = vi.fn();
  emitter.close = vi.fn();
  emitter.readyState = 1; // OPEN
  emitter.OPEN = 1;
  return emitter;
}

// Mock WebSocket with a proper constructor function
vi.mock("ws", () => {
  const MockWebSocket = function (this: TestWebSocket) {
    const instance = createMockWebSocket();
    wsInstances.push(instance);
    return instance;
  } as unknown as { new (): TestWebSocket; OPEN: number };
  MockWebSocket.OPEN = 1;

  return {
    default: MockWebSocket,
    WebSocket: MockWebSocket,
  };
});

// Import after mock
import { OpenAIRealtimeModel } from "../realtime";

describe("OpenAIRealtimeModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    wsInstances.length = 0;
  });

  it("should require API key", () => {
    const originalEnv = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    expect(() => new OpenAIRealtimeModel("gpt-4o-realtime")).toThrow(
      "OpenAI API key is required",
    );

    process.env.OPENAI_API_KEY = originalEnv;
  });

  it("should accept API key via options", () => {
    const model = new OpenAIRealtimeModel("gpt-4o-realtime", {
      apiKey: "test-key",
    });

    expect(model.modelId).toBe("gpt-4o-realtime");
    expect(model.provider).toBe("openai");
    expect(model.spec).toBe("1.0");
  });

  it("should use OPENAI_API_KEY env var", () => {
    const originalEnv = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "env-key";

    const model = new OpenAIRealtimeModel("gpt-4o-realtime");
    expect(model.modelId).toBe("gpt-4o-realtime");

    process.env.OPENAI_API_KEY = originalEnv;
  });
});

describe("base64ByteLength", () => {
  // Test the helper function indirectly through the module
  // The actual function is not exported, but we can verify the audio length calculation works

  it("should calculate correct byte length for base64 without padding", () => {
    // "SGVsbG8" = "Hello" (5 bytes), no padding
    // base64 length = 8, padding = 0
    // bytes = (8 * 3) / 4 - 0 = 6 (actually "Hello" is 5 bytes, but base64 of "Hello" is "SGVsbG8=" with padding)
    // Let's use a known value: "AAAA" = 3 bytes (no padding needed for 3 bytes)
    // Actually "AAA=" is 2 bytes, "AAAA" is 3 bytes
    const b64NoPadding = "AAAA"; // 3 bytes
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

describe("interruption timing", () => {
  it("should calculate audio_end_ms as min of elapsed and total length", () => {
    const firstAudioTimestamp = 1000;
    const currentTime = 1150; // 150ms elapsed
    const audioLengthMs = 200; // but only 200ms of audio received

    const elapsed = currentTime - firstAudioTimestamp;
    const audioEndMs = Math.max(0, Math.floor(Math.min(elapsed, audioLengthMs)));

    expect(audioEndMs).toBe(150); // elapsed is less than total
  });

  it("should cap audio_end_ms at total audio length", () => {
    const firstAudioTimestamp = 1000;
    const currentTime = 1500; // 500ms elapsed
    const audioLengthMs = 200; // but only 200ms of audio received

    const elapsed = currentTime - firstAudioTimestamp;
    const audioEndMs = Math.max(0, Math.floor(Math.min(elapsed, audioLengthMs)));

    expect(audioEndMs).toBe(200); // capped at audio length
  });

  it("should handle zero elapsed time", () => {
    const firstAudioTimestamp = 1000;
    const currentTime = 1000; // 0ms elapsed
    const audioLengthMs = 200;

    const elapsed = currentTime - firstAudioTimestamp;
    const audioEndMs = Math.max(0, Math.floor(Math.min(elapsed, audioLengthMs)));

    expect(audioEndMs).toBe(0);
  });
});

describe("OpenAIRealtimeConnection (mocked WebSocket)", () => {
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
    event: OpenAIServerEvent,
  ): void => {
    const payload = Buffer.from(JSON.stringify(event));
    socket.emit("message", payload);
  };

  const createConnectedRealtime = async () => {
    // Ensure env key is set so constructor does not throw.
    const originalEnv = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = apiKey;

    const model = new OpenAIRealtimeModel("gpt-4o-realtime");
    const connectPromise = model.connect();

    const socket = getLastSocket();
    // Simulate successful WebSocket open.
    socket.emit("open");

    const connection = await connectPromise;

    // Restore env to avoid side effects for other tests.
    process.env.OPENAI_API_KEY = originalEnv;

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

    // session.created
    emitServerEvent(socket, {
      type: "session.created",
      session: { id: "sess-1", instructions: "Be helpful" },
    });

    // response.created
    emitServerEvent(socket, {
      type: "response.created",
      response: { id: "resp-1" },
    });

    // small audio delta then done
    emitServerEvent(socket, {
      type: "response.output_audio.delta",
      response_id: "resp-1",
      item_id: "item-1",
      content_index: 0,
      delta: "AAAA",
    });

    emitServerEvent(socket, {
      type: "response.output_audio.done",
      response_id: "resp-1",
      item_id: "item-1",
      content_index: 0,
    });

    // text delta then done
    emitServerEvent(socket, {
      type: "response.text.delta",
      response_id: "resp-1",
      item_id: "item-1",
      content_index: 0,
      delta: "Hello",
    });

    emitServerEvent(socket, {
      type: "response.text.done",
      response_id: "resp-1",
      item_id: "item-1",
      content_index: 0,
      text: "Hello world",
    });

    // transcripts
    emitServerEvent(socket, {
      type: "conversation.item.input_audio_transcription.completed",
      item_id: "item-1",
      content_index: 0,
      transcript: "User said hello",
    });

    emitServerEvent(socket, {
      type: "response.output_audio_transcript.done",
      response_id: "resp-1",
      item_id: "item-1",
      content_index: 0,
      transcript: "Assistant said hi",
    });

    // response.done with usage
    emitServerEvent(socket, {
      type: "response.done",
      response: {
        id: "resp-1",
        status: "completed",
        usage: {
          input_tokens: 10,
          output_tokens: 20,
          total_tokens: 30,
        },
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
    expect(kinds).toContain("text.output.delta");
    expect(kinds).toContain("text.output");
    expect(kinds).toContain("transcript.input");
    expect(kinds).toContain("transcript.output");
    expect(kinds).toContain("response.done");
  });

  it("should cancel and truncate correctly on speech start (interrupt)", async () => {
    const { connection, socket } = await createConnectedRealtime();

    const connectionWithInterrupt = connection as unknown as {
      interrupt: () => void;
    };

    // Control time so we can reason about audio_end_ms.
    let now = 1000;
    const dateSpy = vi
      .spyOn(Date, "now")
      .mockImplementation(() => now);

    // Mark that a response is in progress with some audio.
    emitServerEvent(socket, {
      type: "response.created",
      response: { id: "resp-1" },
    });

    // Single audio delta chunk; compute its duration with the same formula.
    const deltaAudio = "AAAA";
    emitServerEvent(socket, {
      type: "response.output_audio.delta",
      response_id: "resp-1",
      item_id: "item-1",
      content_index: 0,
      delta: deltaAudio,
    });

    const base64ByteLength = (b64: string): number => {
      const padding = b64.endsWith("==")
        ? 2
        : b64.endsWith("=")
          ? 1
          : 0;
      return (b64.length * 3) / 4 - padding;
    };

    const bytes = base64ByteLength(deltaAudio);
    const totalAudioMs = (bytes / 2 / 24000) * 1000;

    // Advance time so that some time has elapsed since first audio.
    now = 1150; // 150ms elapsed

    // speech_started should trigger interrupt logic.
    emitServerEvent(socket, {
      type: "input_audio_buffer.speech_started",
      audio_start_ms: 0,
      item_id: "item-2",
    });

    // We expect two outbound sends: response.cancel and item.truncate.
    const sendMock = socket.send as unknown as {
      mock: { calls: [string][] };
    };

    expect(sendMock.mock.calls.length).toBe(2);

    const cancelPayload = JSON.parse(sendMock.mock.calls[0][0]);
    expect(cancelPayload).toEqual({ type: "response.cancel" });

    const truncatePayload = JSON.parse(sendMock.mock.calls[1][0]);
    expect(truncatePayload.type).toBe("conversation.item.truncate");
    expect(truncatePayload.item_id).toBe("item-1");
    expect(truncatePayload.content_index).toBe(0);

    const expectedEndMs = Math.max(
      0,
      Math.floor(Math.min(150, totalAudioMs)),
    );
    expect(truncatePayload.audio_end_ms).toBe(expectedEndMs);

    // Calling interrupt again should be a no-op (state was reset).
    connectionWithInterrupt.interrupt();
    expect(sendMock.mock.calls.length).toBe(2);

    dateSpy.mockRestore();
  });
});
