import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import { RealtimeError } from "@kernl-sdk/protocol";

import { RealtimeSession } from "../session";
import { RealtimeAgent } from "../agent";
import { WebSocketTransport } from "../transport";
import { Context } from "@/context";
import { FunctionToolkit, tool } from "@/tool";
import { MisconfiguredError } from "@/lib/error";
import {
  createMockRealtimeModel,
  createMockConnection,
  createMockChannel,
  MockRealtimeModel,
  MockRealtimeConnection,
  MockRealtimeChannel,
} from "./fixtures";

describe("RealtimeSession", () => {
  let model: MockRealtimeModel;
  let connection: MockRealtimeConnection;
  let agent: RealtimeAgent;

  beforeEach(() => {
    connection = createMockConnection();
    model = createMockRealtimeModel({ connection });
    agent = new RealtimeAgent({
      id: "test-agent",
      name: "Test Agent",
      instructions: "You are a test agent.",
      model,
    });
  });

  describe("constructor", () => {
    it("should store agent reference", () => {
      const session = new RealtimeSession(agent);
      expect(session.agent).toBe(agent);
    });

    it("should use agent's model by default", () => {
      const session = new RealtimeSession(agent);
      expect(session.model).toBe(model);
    });

    it("should allow model override via options", () => {
      const overrideModel = createMockRealtimeModel({
        provider: "custom",
        modelId: "custom-model",
      });
      const session = new RealtimeSession(agent, { model: overrideModel });
      expect(session.model).toBe(overrideModel);
      expect(session.model.provider).toBe("custom");
    });

    it("should create default context if not provided", () => {
      const session = new RealtimeSession(agent);
      expect(session.context).toBeInstanceOf(Context);
      expect(session.context.namespace).toBe("kernl");
    });

    it("should use provided context", () => {
      const ctx = new Context("custom-namespace", { custom: "data" });
      const session = new RealtimeSession(agent, { context: ctx });
      expect(session.context).toBe(ctx);
      expect(session.context.namespace).toBe("custom-namespace");
    });

    it("should store channel if provided", () => {
      const channel = createMockChannel();
      const session = new RealtimeSession(agent, { channel });
      expect(session.channel).toBe(channel);
    });

    it("should have null channel by default", () => {
      const session = new RealtimeSession(agent);
      expect(session.channel).toBeNull();
    });

    it("should throw MisconfiguredError when channel used with WebRTC transport", () => {
      const channel = createMockChannel();
      const webrtcTransport = {
        handlesAudio: true,
        connect: vi.fn(),
      };

      expect(
        () =>
          new RealtimeSession(agent, {
            channel,
            transport: webrtcTransport,
          }),
      ).toThrow(MisconfiguredError);

      expect(
        () =>
          new RealtimeSession(agent, {
            channel,
            transport: webrtcTransport,
          }),
      ).toThrow(/cannot use channel with WebRTC transport/i);
    });

    it("should have null id before connecting", () => {
      const session = new RealtimeSession(agent);
      expect(session.id).toBeNull();
    });
  });

  describe("connect()", () => {
    it("should call model.connect() with session config", async () => {
      const session = new RealtimeSession(agent);
      await session.connect();

      expect(model.connect).toHaveBeenCalledTimes(1);
      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionConfig: expect.objectContaining({
            instructions: "You are a test agent.",
          }),
        }),
      );
    });

    it("should use custom transport when provided", async () => {
      const customConnection = createMockConnection();
      const transport = new WebSocketTransport();
      vi.spyOn(transport, "connect").mockResolvedValue(customConnection);

      const session = new RealtimeSession(agent, { transport });
      await session.connect();

      expect(transport.connect).toHaveBeenCalledWith(
        model,
        expect.objectContaining({
          sessionConfig: expect.any(Object),
        }),
      );
      expect(model.connect).not.toHaveBeenCalled();
    });

    it("should attach event listeners to connection", async () => {
      const session = new RealtimeSession(agent);
      await session.connect();

      // Verify listeners were attached by checking emitter
      const eventListener = vi.fn();
      session.on("error", eventListener);

      connection.simulateError(new Error("Test error"));

      expect(eventListener).toHaveBeenCalledWith(expect.any(Error));
    });

    it("should emit current status after connecting", async () => {
      const statusListener = vi.fn();
      const session = new RealtimeSession(agent);
      session.on("status", statusListener);

      await session.connect();

      expect(statusListener).toHaveBeenCalledWith("connected");
    });

    it("should set session id on session.created event", async () => {
      const session = new RealtimeSession(agent);
      await session.connect();

      expect(session.id).toBeNull();

      connection.simulateEvent({
        kind: "session.created",
        session: { id: "session-123", config: {} },
      });

      expect(session.id).toBe("session-123");
    });

    it("should pass credential from options to connect", async () => {
      const credential = {
        kind: "token" as const,
        token: "ephemeral-token",
        expiresAt: new Date(),
      };

      const session = new RealtimeSession(agent, { credential });
      await session.connect();

      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          credential,
        }),
      );
    });

    it("should prefer options.credential over connectOptions.credential", async () => {
      const optionsCredential = {
        kind: "token" as const,
        token: "options-token",
        expiresAt: new Date(),
      };
      const connectOptionsCredential = {
        kind: "token" as const,
        token: "connect-options-token",
        expiresAt: new Date(),
      };

      const session = new RealtimeSession(agent, {
        credential: optionsCredential,
        connectOptions: { credential: connectOptionsCredential },
      });
      await session.connect();

      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          credential: optionsCredential,
        }),
      );
    });
  });

  describe("buildSessionConfig()", () => {
    it("should include agent instructions", async () => {
      const session = new RealtimeSession(agent);
      await session.connect();

      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionConfig: expect.objectContaining({
            instructions: "You are a test agent.",
          }),
        }),
      );
    });

    it("should serialize tools from agent", async () => {
      const testTool = tool({
        id: "test-tool",
        name: "Test Tool",
        description: "A test tool",
        parameters: z.object({ input: z.string() }),
        execute: async () => "result",
      });

      const toolkit = new FunctionToolkit({
        id: "test-toolkit",
        tools: [testTool],
      });

      const agentWithTools = new RealtimeAgent({
        id: "tools-agent",
        name: "Tools Agent",
        instructions: "Test",
        model,
        toolkits: [toolkit],
      });

      const session = new RealtimeSession(agentWithTools);
      await session.connect();

      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionConfig: expect.objectContaining({
            tools: expect.arrayContaining([
              expect.objectContaining({
                name: "test-tool",
              }),
            ]),
          }),
        }),
      );
    });

    it("should include voice config from agent", async () => {
      const agentWithVoice = new RealtimeAgent({
        id: "voice-agent",
        name: "Voice Agent",
        instructions: "Test",
        model,
        voice: { voiceId: "shimmer", speed: 1.5 },
      });

      const session = new RealtimeSession(agentWithVoice);
      await session.connect();

      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionConfig: expect.objectContaining({
            voice: { voiceId: "shimmer", speed: 1.5 },
          }),
        }),
      );
    });

    it("should set server VAD turn detection", async () => {
      const session = new RealtimeSession(agent);
      await session.connect();

      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionConfig: expect.objectContaining({
            turnDetection: { mode: "server_vad" },
          }),
        }),
      );
    });

    it("should set PCM audio format at 24kHz", async () => {
      const session = new RealtimeSession(agent);
      await session.connect();

      expect(model.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionConfig: expect.objectContaining({
            audio: {
              inputFormat: { mimeType: "audio/pcm", sampleRate: 24000 },
              outputFormat: { mimeType: "audio/pcm", sampleRate: 24000 },
            },
          }),
        }),
      );
    });
  });

  describe("close()", () => {
    it("should close channel if present", async () => {
      const channel = createMockChannel();
      const session = new RealtimeSession(agent, { channel });
      await session.connect();

      session.close();

      expect(channel.close).toHaveBeenCalled();
    });

    it("should close connection if present", async () => {
      const session = new RealtimeSession(agent);
      await session.connect();

      session.close();

      expect(connection.close).toHaveBeenCalled();
    });

    it("should handle close when not connected", () => {
      const session = new RealtimeSession(agent);

      // Should not throw
      expect(() => session.close()).not.toThrow();
    });
  });

  describe("onEvent() - event routing", () => {
    let session: RealtimeSession;
    let channel: MockRealtimeChannel;

    beforeEach(async () => {
      channel = createMockChannel();
      session = new RealtimeSession(agent, { channel });
      await session.connect();
    });

    describe("audio events", () => {
      it("should emit 'audio' on audio.output.delta", () => {
        const audioListener = vi.fn();
        session.on("audio", audioListener);

        const event = {
          kind: "audio.output.delta" as const,
          responseId: "resp-1",
          itemId: "item-1",
          audio: "base64audiodata",
        };
        connection.simulateEvent(event);

        expect(audioListener).toHaveBeenCalledWith(event);
      });

      it("should forward audio to channel on audio.output.delta", () => {
        const event = {
          kind: "audio.output.delta" as const,
          responseId: "resp-1",
          itemId: "item-1",
          audio: "base64audiodata",
        };
        connection.simulateEvent(event);

        expect(channel.sendAudio).toHaveBeenCalledWith("base64audiodata");
      });

      it("should emit 'audio' on audio.output.done", () => {
        const audioListener = vi.fn();
        session.on("audio", audioListener);

        const event = {
          kind: "audio.output.done" as const,
          responseId: "resp-1",
          itemId: "item-1",
        };
        connection.simulateEvent(event);

        expect(audioListener).toHaveBeenCalledWith(event);
      });
    });

    describe("transcript events", () => {
      it("should emit 'transcript' on transcript.input", () => {
        const transcriptListener = vi.fn();
        session.on("transcript", transcriptListener);

        const event = {
          kind: "transcript.input" as const,
          itemId: "item-1",
          text: "Hello world",
        };
        connection.simulateEvent(event);

        expect(transcriptListener).toHaveBeenCalledWith(event);
      });

      it("should emit 'transcript' on transcript.output", () => {
        const transcriptListener = vi.fn();
        session.on("transcript", transcriptListener);

        const event = {
          kind: "transcript.output" as const,
          responseId: "resp-1",
          itemId: "item-1",
          text: "Assistant response",
        };
        connection.simulateEvent(event);

        expect(transcriptListener).toHaveBeenCalledWith(event);
      });
    });

    describe("text events", () => {
      it("should emit 'text' on text.output", () => {
        const textListener = vi.fn();
        session.on("text", textListener);

        const event = {
          kind: "text.output" as const,
          responseId: "resp-1",
          itemId: "item-1",
          text: "Hello!",
        };
        connection.simulateEvent(event);

        expect(textListener).toHaveBeenCalledWith(event);
      });
    });

    describe("error events", () => {
      it("should emit 'error' on session.error", () => {
        const errorListener = vi.fn();
        session.on("error", errorListener);

        const error = new RealtimeError("session_error", "Session error");

        const event = {
          kind: "session.error" as const,
          error,
        };
        connection.simulateEvent(event);

        expect(errorListener).toHaveBeenCalledWith(error);
      });
    });

    describe("session lifecycle events", () => {
      it("should set session id on session.created", () => {
        connection.simulateEvent({
          kind: "session.created",
          session: { id: "new-session-id", config: {} },
        });

        expect(session.id).toBe("new-session-id");
      });
    });

    describe("connection events", () => {
      it("should forward 'error' events from connection", () => {
        const errorListener = vi.fn();
        session.on("error", errorListener);

        const error = new Error("Connection error");
        connection.simulateError(error);

        expect(errorListener).toHaveBeenCalledWith(error);
      });

      it("should forward 'status' events from connection", () => {
        const statusListener = vi.fn();
        session.on("status", statusListener);

        connection.simulateStatus("reconnecting");

        expect(statusListener).toHaveBeenCalledWith("reconnecting");
      });

      it("should call channel.interrupt() on 'interrupted'", () => {
        connection.simulateInterrupted();

        expect(channel.interrupt).toHaveBeenCalled();
      });
    });
  });

  describe("audio/message I/O", () => {
    let session: RealtimeSession;

    beforeEach(async () => {
      session = new RealtimeSession(agent);
      await session.connect();
      connection.clearSentEvents();
    });

    describe("sendAudio()", () => {
      it("should send audio.input.append event to connection", () => {
        session.sendAudio("base64audiodata");

        const event = connection.getLastSentEvent("audio.input.append");
        expect(event).toBeDefined();
        expect(event?.kind).toBe("audio.input.append");
      });

      it("should include audio data in event", () => {
        session.sendAudio("base64audiodata");

        const event = connection.getLastSentEvent("audio.input.append");
        expect(event?.audio).toBe("base64audiodata");
      });

      it("should no-op when not connected", () => {
        const unconnectedSession = new RealtimeSession(agent);

        // Should not throw
        expect(() => unconnectedSession.sendAudio("data")).not.toThrow();
      });
    });

    describe("commit()", () => {
      it("should send audio.input.commit event", () => {
        session.commit();

        const event = connection.getLastSentEvent("audio.input.commit");
        expect(event).toBeDefined();
        expect(event?.kind).toBe("audio.input.commit");
      });

      it("should no-op when not connected", () => {
        const unconnectedSession = new RealtimeSession(agent);
        expect(() => unconnectedSession.commit()).not.toThrow();
      });
    });

    describe("sendMessage()", () => {
      it("should send item.create event with user message", () => {
        session.sendMessage("Hello, assistant!");

        const event = connection.getLastSentEvent("item.create");
        expect(event).toBeDefined();
        expect(event?.kind).toBe("item.create");
      });

      it("should format message using protocol helper", () => {
        session.sendMessage("Hello, assistant!");

        const event = connection.getLastSentEvent("item.create");
        expect(event?.item).toMatchObject({
          role: "user",
        });
      });
    });

    describe("interrupt()", () => {
      it("should send response.cancel to connection", () => {
        session.interrupt();

        const event = connection.getLastSentEvent("response.cancel");
        expect(event).toBeDefined();
        expect(event?.kind).toBe("response.cancel");
      });

      it("should call channel.interrupt()", async () => {
        const channel = createMockChannel();
        const sessionWithChannel = new RealtimeSession(agent, { channel });
        await sessionWithChannel.connect();

        sessionWithChannel.interrupt();

        expect(channel.interrupt).toHaveBeenCalled();
      });
    });

    describe("mute() / unmute()", () => {
      it("should call connection.mute()", () => {
        session.mute();
        expect(connection.mute).toHaveBeenCalled();
      });

      it("should call connection.unmute()", () => {
        session.unmute();
        expect(connection.unmute).toHaveBeenCalled();
      });
    });
  });

  describe("channel integration", () => {
    let session: RealtimeSession;
    let channel: MockRealtimeChannel;

    beforeEach(async () => {
      channel = createMockChannel();
      session = new RealtimeSession(agent, { channel });
      await session.connect();
      connection.clearSentEvents();
    });

    it("should forward channel 'audio' events to sendAudio()", () => {
      channel.simulateAudioInput("channel-audio-data");

      const event = connection.getLastSentEvent("audio.input.append");
      expect(event).toBeDefined();
      expect(event?.audio).toBe("channel-audio-data");
    });

    it("should forward channel 'commit' events to commit()", () => {
      channel.simulateCommit();

      const event = connection.getLastSentEvent("audio.input.commit");
      expect(event).toBeDefined();
    });

    it("should forward channel 'interrupt' events to interrupt()", () => {
      channel.simulateInterrupt();

      const event = connection.getLastSentEvent("response.cancel");
      expect(event).toBeDefined();
    });
  });

  describe("performActions() - tool execution", () => {
    let testTool: ReturnType<typeof tool>;
    let agentWithTools: RealtimeAgent;
    let session: RealtimeSession;

    beforeEach(async () => {
      testTool = tool({
        id: "echo-tool",
        name: "Echo Tool",
        description: "Echoes input back",
        parameters: z.object({ message: z.string() }),
        execute: async (_ctx, params) => `Echo: ${params.message}`,
      });

      const toolkit = new FunctionToolkit({
        id: "test-toolkit",
        tools: [testTool],
      });

      agentWithTools = new RealtimeAgent({
        id: "tools-agent",
        name: "Tools Agent",
        instructions: "Test",
        model,
        toolkits: [toolkit],
      });

      session = new RealtimeSession(agentWithTools);
      await session.connect();
      connection.clearSentEvents();
    });

    describe("tool lookup", () => {
      it("should find tool by id from agent", async () => {
        connection.simulateEvent({
          kind: "tool.call",
          callId: "call-1",
          toolId: "echo-tool",
          arguments: JSON.stringify({ message: "hello" }),
        });

        // Wait for async execution
        await vi.waitFor(() => {
          const event = connection.getLastSentEvent("tool.result");
          expect(event).toBeDefined();
        });

        const event = connection.getLastSentEvent("tool.result");
        expect(event?.callId).toBe("call-1");
        expect(event?.result).toContain("Echo: hello");
      });

      it("should send error result for unknown tool", async () => {
        connection.simulateEvent({
          kind: "tool.call",
          callId: "call-1",
          toolId: "unknown-tool",
          arguments: "{}",
        });

        await vi.waitFor(() => {
          const event = connection.getLastSentEvent("tool.result");
          expect(event).toBeDefined();
        });

        const event = connection.getLastSentEvent("tool.result");
        expect(event?.callId).toBe("call-1");
        expect(event?.error).toContain("Unknown tool");
      });
    });

    describe("result handling", () => {
      it("should send tool.result with result on success", async () => {
        connection.simulateEvent({
          kind: "tool.call",
          callId: "call-1",
          toolId: "echo-tool",
          arguments: JSON.stringify({ message: "test" }),
        });

        await vi.waitFor(() => {
          const event = connection.getLastSentEvent("tool.result");
          expect(event).toBeDefined();
        });

        const event = connection.getLastSentEvent("tool.result");
        expect(event?.kind).toBe("tool.result");
        expect(event?.callId).toBe("call-1");
        expect(event?.result).toBe("Echo: test");
        expect(event?.error).toBeUndefined();
      });

      it("should send tool.result with error on failure", async () => {
        const failingTool = tool({
          id: "failing-tool",
          description: "Always fails",
          parameters: undefined,
          execute: async () => {
            throw new Error("Tool failed");
          },
        });

        const failingToolkit = new FunctionToolkit({
          id: "failing-toolkit",
          tools: [failingTool],
        });

        // Create a fresh model/connection to avoid shared state with other sessions
        const failingConnection = createMockConnection();
        const failingModel = createMockRealtimeModel({ connection: failingConnection });

        const failingAgent = new RealtimeAgent({
          id: "failing-agent",
          name: "Failing Agent",
          instructions: "Test",
          model: failingModel,
          toolkits: [failingToolkit],
        });

        const failingSession = new RealtimeSession(failingAgent);
        await failingSession.connect();
        failingConnection.clearSentEvents();

        failingConnection.simulateEvent({
          kind: "tool.call",
          callId: "call-1",
          toolId: "failing-tool",
          arguments: "{}",
        });

        await vi.waitFor(() => {
          const event = failingConnection.getLastSentEvent("tool.result");
          expect(event).toBeDefined();
        });

        const event = failingConnection.getLastSentEvent("tool.result");
        expect(event?.kind).toBe("tool.result");
        expect(event?.callId).toBe("call-1");
        expect(event?.error).toContain("Tool failed");
      });
    });
  });
});
