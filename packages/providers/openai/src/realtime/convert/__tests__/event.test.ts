import { describe, it, expect } from "vitest";

import {
  TURN_DETECTION,
  SESSION_CONFIG,
  ITEM,
  CLIENT_EVENT,
  SERVER_EVENT,
} from "../event";

describe("TURN_DETECTION codec", () => {
  describe("encode", () => {
    it("should encode server_vad mode", () => {
      const result = TURN_DETECTION.encode({
        mode: "server_vad",
        threshold: 0.5,
        silenceDurationMs: 500,
        prefixPaddingMs: 300,
        createResponse: true,
        interruptResponse: true,
      });

      expect(result).toEqual({
        type: "server_vad",
        threshold: 0.5,
        silence_duration_ms: 500,
        prefix_padding_ms: 300,
        create_response: true,
        interrupt_response: true,
      });
    });

    it("should encode manual mode as none", () => {
      const result = TURN_DETECTION.encode({ mode: "manual" });

      expect(result).toEqual({
        type: "none",
        threshold: undefined,
        silence_duration_ms: undefined,
        prefix_padding_ms: undefined,
        create_response: undefined,
        interrupt_response: undefined,
      });
    });
  });

  describe("decode", () => {
    it("should decode server_vad type", () => {
      const result = TURN_DETECTION.decode({
        type: "server_vad",
        threshold: 0.5,
        silence_duration_ms: 500,
        prefix_padding_ms: 300,
        create_response: true,
        interrupt_response: true,
      });

      expect(result).toEqual({
        mode: "server_vad",
        threshold: 0.5,
        silenceDurationMs: 500,
        prefixPaddingMs: 300,
        createResponse: true,
        interruptResponse: true,
      });
    });

    it("should decode none type as manual", () => {
      const result = TURN_DETECTION.decode({ type: "none" });

      expect(result).toEqual({
        mode: "manual",
        threshold: undefined,
        silenceDurationMs: undefined,
        prefixPaddingMs: undefined,
        createResponse: undefined,
        interruptResponse: undefined,
      });
    });
  });
});

describe("SESSION_CONFIG codec", () => {
  describe("encode", () => {
    it("should encode basic session config", () => {
      const result = SESSION_CONFIG.encode({
        instructions: "You are a helpful assistant",
        modalities: ["text", "audio"],
        voice: { voiceId: "alloy" },
      });

      expect(result).toEqual({
        instructions: "You are a helpful assistant",
        modalities: ["text", "audio"],
        voice: "alloy",
        input_audio_format: undefined,
        output_audio_format: undefined,
        turn_detection: undefined,
        tools: undefined,
      });
    });

    it("should encode session config with tools", () => {
      const result = SESSION_CONFIG.encode({
        tools: [
          {
            kind: "function",
            name: "get_weather",
            description: "Get weather",
            parameters: { type: "object", properties: {} },
          },
        ],
      });

      expect(result.tools).toEqual([
        {
          type: "function",
          name: "get_weather",
          description: "Get weather",
          parameters: { type: "object", properties: {} },
        },
      ]);
    });

    it("should encode session config with turn detection", () => {
      const result = SESSION_CONFIG.encode({
        turnDetection: {
          mode: "server_vad",
          threshold: 0.5,
        },
      });

      expect(result.turn_detection).toEqual({
        type: "server_vad",
        threshold: 0.5,
        silence_duration_ms: undefined,
        prefix_padding_ms: undefined,
        create_response: undefined,
        interrupt_response: undefined,
      });
    });
  });

  describe("decode", () => {
    it("should decode basic session config", () => {
      const result = SESSION_CONFIG.decode({
        instructions: "You are a helpful assistant",
        modalities: ["text", "audio"],
        voice: "alloy",
      });

      expect(result).toEqual({
        instructions: "You are a helpful assistant",
        modalities: ["text", "audio"],
        voice: { voiceId: "alloy" },
        turnDetection: undefined,
      });
    });
  });
});

describe("ITEM codec", () => {
  describe("encode", () => {
    it("should encode user message with text", () => {
      const result = ITEM.encode({
        kind: "message",
        id: "msg-1",
        role: "user",
        content: [{ kind: "text", text: "Hello" }],
      });

      expect(result).toEqual({
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "Hello" }],
      });
    });

    it("should encode assistant message with output_text", () => {
      const result = ITEM.encode({
        kind: "message",
        id: "msg-2",
        role: "assistant",
        content: [{ kind: "text", text: "Hi there" }],
      });

      expect(result).toEqual({
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: "Hi there" }],
      });
    });

    it("should encode tool call", () => {
      const result = ITEM.encode({
        kind: "tool.call",
        callId: "call-1",
        toolId: "get_weather",
        state: "completed",
        arguments: '{"city": "NYC"}',
      });

      expect(result).toEqual({
        type: "function_call",
        call_id: "call-1",
        name: "get_weather",
        arguments: '{"city": "NYC"}',
      });
    });

    it("should encode tool result", () => {
      const result = ITEM.encode({
        kind: "tool.result",
        callId: "call-1",
        toolId: "get_weather",
        state: "completed",
        result: { temp: 72 },
        error: null,
      });

      expect(result).toEqual({
        type: "function_call_output",
        call_id: "call-1",
        output: '{"temp":72}',
      });
    });

    it("should encode tool result with error", () => {
      const result = ITEM.encode({
        kind: "tool.result",
        callId: "call-1",
        toolId: "get_weather",
        state: "completed",
        result: null,
        error: "City not found",
      });

      expect(result).toEqual({
        type: "function_call_output",
        call_id: "call-1",
        output: "City not found",
      });
    });
  });

  describe("decode", () => {
    it("should decode message item", () => {
      const result = ITEM.decode({
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "Hello" }],
      });

      expect(result.kind).toBe("message");
      if (result.kind === "message") {
        expect(result.role).toBe("user");
        expect(result.content).toEqual([{ kind: "text", text: "Hello" }]);
      }
    });

    it("should decode function call item", () => {
      const result = ITEM.decode({
        type: "function_call",
        call_id: "call-1",
        name: "get_weather",
        arguments: '{"city": "NYC"}',
      });

      expect(result).toEqual({
        kind: "tool.call",
        callId: "call-1",
        toolId: "get_weather",
        state: "completed",
        arguments: '{"city": "NYC"}',
      });
    });

    it("should decode function call output item", () => {
      const result = ITEM.decode({
        type: "function_call_output",
        call_id: "call-1",
        output: '{"temp": 72}',
      });

      expect(result).toEqual({
        kind: "tool.result",
        callId: "call-1",
        toolId: "",
        state: "completed",
        result: '{"temp": 72}',
        error: null,
      });
    });
  });
});

describe("CLIENT_EVENT codec", () => {
  describe("encode", () => {
    it("should encode session.update", () => {
      const result = CLIENT_EVENT.encode({
        kind: "session.update",
        config: { instructions: "Be helpful" },
      });

      expect(result).toEqual({
        type: "session.update",
        session: {
          instructions: "Be helpful",
          modalities: undefined,
          voice: undefined,
          input_audio_format: undefined,
          output_audio_format: undefined,
          turn_detection: undefined,
          tools: undefined,
        },
      });
    });

    it("should encode audio.input.append", () => {
      const result = CLIENT_EVENT.encode({
        kind: "audio.input.append",
        audio: "base64data",
      });

      expect(result).toEqual({
        type: "input_audio_buffer.append",
        audio: "base64data",
      });
    });

    it("should encode audio.input.commit", () => {
      const result = CLIENT_EVENT.encode({ kind: "audio.input.commit" });
      expect(result).toEqual({ type: "input_audio_buffer.commit" });
    });

    it("should encode audio.input.clear", () => {
      const result = CLIENT_EVENT.encode({ kind: "audio.input.clear" });
      expect(result).toEqual({ type: "input_audio_buffer.clear" });
    });

    it("should encode response.create", () => {
      const result = CLIENT_EVENT.encode({
        kind: "response.create",
        config: { instructions: "Override", modalities: ["text"] },
      });

      expect(result).toEqual({
        type: "response.create",
        response: { instructions: "Override", modalities: ["text"] },
      });
    });

    it("should encode response.cancel", () => {
      const result = CLIENT_EVENT.encode({
        kind: "response.cancel",
        responseId: "resp-1",
      });

      expect(result).toEqual({
        type: "response.cancel",
        response_id: "resp-1",
      });
    });

    it("should encode tool.result", () => {
      const result = CLIENT_EVENT.encode({
        kind: "tool.result",
        callId: "call-1",
        result: '{"temp": 72}',
      });

      expect(result).toEqual({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: "call-1",
          output: '{"temp": 72}',
        },
      });
    });

    it("should return null for activity events", () => {
      expect(CLIENT_EVENT.encode({ kind: "activity.start" })).toBeNull();
      expect(CLIENT_EVENT.encode({ kind: "activity.end" })).toBeNull();
    });
  });
});

describe("SERVER_EVENT codec", () => {
  describe("decode", () => {
    it("should decode session.created", () => {
      const result = SERVER_EVENT.decode({
        type: "session.created",
        session: { id: "sess-1", instructions: "Be helpful" },
      });

      expect(result).toEqual({
        kind: "session.created",
        session: {
          id: "sess-1",
          config: {
            instructions: "Be helpful",
            modalities: undefined,
            voice: undefined,
            turnDetection: undefined,
          },
        },
      });
    });

    it("should decode error", () => {
      const result = SERVER_EVENT.decode({
        type: "error",
        error: { code: "invalid_request", message: "Bad request" },
      });

      expect(result).toEqual({
        kind: "session.error",
        error: { code: "invalid_request", message: "Bad request" },
      });
    });

    it("should decode response.output_audio.delta", () => {
      const result = SERVER_EVENT.decode({
        type: "response.output_audio.delta",
        response_id: "resp-1",
        item_id: "item-1",
        content_index: 0,
        delta: "base64audio",
      });

      expect(result).toEqual({
        kind: "audio.output.delta",
        responseId: "resp-1",
        itemId: "item-1",
        audio: "base64audio",
      });
    });

    it("should decode response.output_audio.done", () => {
      const result = SERVER_EVENT.decode({
        type: "response.output_audio.done",
        response_id: "resp-1",
        item_id: "item-1",
        content_index: 0,
      });

      expect(result).toEqual({
        kind: "audio.output.done",
        responseId: "resp-1",
        itemId: "item-1",
      });
    });

    it("should decode response.text.delta", () => {
      const result = SERVER_EVENT.decode({
        type: "response.text.delta",
        response_id: "resp-1",
        item_id: "item-1",
        content_index: 0,
        delta: "Hello",
      });

      expect(result).toEqual({
        kind: "text.output.delta",
        responseId: "resp-1",
        itemId: "item-1",
        delta: "Hello",
      });
    });

    it("should decode response.text.done as text.output", () => {
      const result = SERVER_EVENT.decode({
        type: "response.text.done",
        response_id: "resp-1",
        item_id: "item-1",
        content_index: 0,
        text: "Hello world",
      });

      expect(result).toEqual({
        kind: "text.output",
        responseId: "resp-1",
        itemId: "item-1",
        text: "Hello world",
      });
    });

    it("should decode input transcription completed as transcript.input", () => {
      const result = SERVER_EVENT.decode({
        type: "conversation.item.input_audio_transcription.completed",
        item_id: "item-1",
        content_index: 0,
        transcript: "Hello there",
      });

      expect(result).toEqual({
        kind: "transcript.input",
        itemId: "item-1",
        text: "Hello there",
      });
    });

    it("should decode output audio transcript done as transcript.output", () => {
      const result = SERVER_EVENT.decode({
        type: "response.output_audio_transcript.done",
        response_id: "resp-1",
        item_id: "item-1",
        content_index: 0,
        transcript: "Hi there",
      });

      expect(result).toEqual({
        kind: "transcript.output",
        responseId: "resp-1",
        itemId: "item-1",
        text: "Hi there",
      });
    });

    it("should decode response.done with completed status", () => {
      const result = SERVER_EVENT.decode({
        type: "response.done",
        response: {
          id: "resp-1",
          status: "completed",
          usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
        },
      });

      expect(result).toEqual({
        kind: "response.done",
        responseId: "resp-1",
        status: "completed",
        usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      });
    });

    it("should decode response.done with in_progress status as failed", () => {
      const result = SERVER_EVENT.decode({
        type: "response.done",
        response: { id: "resp-1", status: "in_progress" },
      });

      expect(result?.kind).toBe("response.done");
      if (result?.kind === "response.done") {
        expect(result.status).toBe("failed");
      }
    });

    it("should decode function call arguments done as tool.call", () => {
      const result = SERVER_EVENT.decode({
        type: "response.function_call_arguments.done",
        response_id: "resp-1",
        item_id: "item-1",
        call_id: "call-1",
        name: "get_weather",
        arguments: '{"city": "NYC"}',
      });

      expect(result).toEqual({
        kind: "tool.call",
        callId: "call-1",
        toolId: "get_weather",
        arguments: '{"city": "NYC"}',
      });
    });

    it("should decode conversation.item.created as item.created", () => {
      const result = SERVER_EVENT.decode({
        type: "conversation.item.created",
        item: {
          type: "message",
          role: "user",
          content: [{ type: "input_text", text: "Hi" }],
        },
        previous_item_id: "prev-1",
      });

      expect(result?.kind).toBe("item.created");
    });

    it("should return null for conversation.item.done", () => {
      const result = SERVER_EVENT.decode({
        type: "conversation.item.done",
        item: { type: "message", role: "user", content: [] },
      });

      expect(result).toBeNull();
    });
  });
});
