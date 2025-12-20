import type { JSONSchema7 } from "json-schema";

/**
 * OpenAI Realtime API wire types (GA).
 */

// =============================================================================
// Client Events
// =============================================================================

export type OpenAIClientEvent =
  | OpenAISessionUpdate
  | OpenAIInputAudioBufferAppend
  | OpenAIInputAudioBufferCommit
  | OpenAIInputAudioBufferClear
  | OpenAIConversationItemCreate
  | OpenAIConversationItemDelete
  | OpenAIConversationItemTruncate
  | OpenAIResponseCreate
  | OpenAIResponseCancel;

export interface OpenAISessionUpdate {
  type: "session.update";
  session: OpenAISessionConfig;
}

export interface OpenAIInputAudioBufferAppend {
  type: "input_audio_buffer.append";
  audio: string;
}

export interface OpenAIInputAudioBufferCommit {
  type: "input_audio_buffer.commit";
}

export interface OpenAIInputAudioBufferClear {
  type: "input_audio_buffer.clear";
}

export interface OpenAIConversationItemCreate {
  type: "conversation.item.create";
  item: OpenAIItem;
  previous_item_id?: string;
}

export interface OpenAIConversationItemDelete {
  type: "conversation.item.delete";
  item_id: string;
}

export interface OpenAIConversationItemTruncate {
  type: "conversation.item.truncate";
  item_id: string;
  content_index: number;
  audio_end_ms: number;
}

export interface OpenAIResponseCreate {
  type: "response.create";
  response?: {
    instructions?: string;
    modalities?: ("text" | "audio")[];
  };
}

export interface OpenAIResponseCancel {
  type: "response.cancel";
  response_id?: string;
}

// =============================================================================
// Server Events
// =============================================================================

export type OpenAIServerEvent =
  | OpenAISessionCreated
  | OpenAISessionUpdated
  | OpenAIError
  | OpenAIInputAudioBufferCommitted
  | OpenAIInputAudioBufferCleared
  | OpenAIInputAudioBufferSpeechStarted
  | OpenAIInputAudioBufferSpeechStopped
  | OpenAIConversationItemCreated
  | OpenAIConversationItemDone
  | OpenAIConversationItemDeleted
  | OpenAIConversationItemTruncated
  | OpenAIResponseCreated
  | OpenAIResponseDone
  | OpenAIResponseOutputAudioDelta
  | OpenAIResponseOutputAudioDone
  | OpenAIResponseTextDelta
  | OpenAIResponseTextDone
  | OpenAIInputAudioTranscriptionDelta
  | OpenAIInputAudioTranscriptionCompleted
  | OpenAIResponseOutputAudioTranscriptDelta
  | OpenAIResponseOutputAudioTranscriptDone
  | OpenAIResponseOutputItemAdded
  | OpenAIResponseOutputItemDone
  | OpenAIResponseFunctionCallArgumentsDelta
  | OpenAIResponseFunctionCallArgumentsDone;

export interface OpenAISessionCreated {
  type: "session.created";
  session: OpenAISession;
}

export interface OpenAISessionUpdated {
  type: "session.updated";
  session: OpenAISession;
}

export interface OpenAIError {
  type: "error";
  error: {
    code: string;
    message: string;
  };
}

export interface OpenAIInputAudioBufferCommitted {
  type: "input_audio_buffer.committed";
  item_id: string;
}

export interface OpenAIInputAudioBufferCleared {
  type: "input_audio_buffer.cleared";
}

export interface OpenAIInputAudioBufferSpeechStarted {
  type: "input_audio_buffer.speech_started";
  audio_start_ms: number;
  item_id: string;
}

export interface OpenAIInputAudioBufferSpeechStopped {
  type: "input_audio_buffer.speech_stopped";
  audio_end_ms: number;
  item_id: string;
}

export interface OpenAIConversationItemCreated {
  type: "conversation.item.created";
  item: OpenAIItem;
  previous_item_id?: string;
}

export interface OpenAIConversationItemDone {
  type: "conversation.item.done";
  item: OpenAIItem;
}

export interface OpenAIConversationItemDeleted {
  type: "conversation.item.deleted";
  item_id: string;
}

export interface OpenAIConversationItemTruncated {
  type: "conversation.item.truncated";
  item_id: string;
  audio_end_ms: number;
  content_index: number;
}

export interface OpenAIResponseCreated {
  type: "response.created";
  response: {
    id: string;
  };
}

export interface OpenAIResponseDone {
  type: "response.done";
  response: {
    id: string;
    status: "completed" | "cancelled" | "failed" | "incomplete" | "in_progress";
    usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens?: number;
    };
  };
}

export interface OpenAIResponseOutputAudioDelta {
  type: "response.output_audio.delta";
  response_id: string;
  item_id: string;
  content_index: number;
  delta: string;
}

export interface OpenAIResponseOutputAudioDone {
  type: "response.output_audio.done";
  response_id: string;
  item_id: string;
  content_index: number;
}

export interface OpenAIResponseTextDelta {
  type: "response.text.delta";
  response_id: string;
  item_id: string;
  content_index: number;
  delta: string;
}

export interface OpenAIResponseTextDone {
  type: "response.text.done";
  response_id: string;
  item_id: string;
  content_index: number;
  text: string;
}

export interface OpenAIInputAudioTranscriptionDelta {
  type: "conversation.item.input_audio_transcription.delta";
  item_id: string;
  content_index?: number;
  delta: string;
}

export interface OpenAIInputAudioTranscriptionCompleted {
  type: "conversation.item.input_audio_transcription.completed";
  item_id: string;
  content_index: number;
  transcript: string;
}

export interface OpenAIResponseOutputAudioTranscriptDelta {
  type: "response.output_audio_transcript.delta";
  response_id: string;
  item_id: string;
  content_index: number;
  delta: string;
}

export interface OpenAIResponseOutputAudioTranscriptDone {
  type: "response.output_audio_transcript.done";
  response_id: string;
  item_id: string;
  content_index: number;
  transcript: string;
}

export interface OpenAIResponseOutputItemAdded {
  type: "response.output_item.added";
  response_id: string;
  output_index: number;
  item: OpenAIFunctionCallItem | OpenAIItem;
}

export interface OpenAIResponseOutputItemDone {
  type: "response.output_item.done";
  response_id: string;
  output_index: number;
  item: OpenAIFunctionCallItem | OpenAIItem;
}

export interface OpenAIResponseFunctionCallArgumentsDelta {
  type: "response.function_call_arguments.delta";
  response_id: string;
  item_id: string;
  call_id: string;
  delta: string;
}

export interface OpenAIResponseFunctionCallArgumentsDone {
  type: "response.function_call_arguments.done";
  response_id: string;
  item_id: string;
  call_id: string;
  name: string;
  arguments: string;
}

// =============================================================================
// Shared Types
// =============================================================================

export interface OpenAISession {
  id: string;
  instructions?: string;
  voice?: string;
  modalities?: ("text" | "audio")[];
  turn_detection?: OpenAITurnDetection;
  input_audio_format?: string;
  output_audio_format?: string;
}

export interface OpenAISessionConfig {
  instructions?: string;
  voice?: string;
  modalities?: ("text" | "audio")[];
  tools?: OpenAITool[];
  turn_detection?: OpenAITurnDetection;
  input_audio_format?: string;
  output_audio_format?: string;
}

export interface OpenAITurnDetection {
  type: "server_vad" | "none";
  threshold?: number;
  silence_duration_ms?: number;
  prefix_padding_ms?: number;
  create_response?: boolean;
  interrupt_response?: boolean;
}

export interface OpenAITool {
  type: "function";
  name: string;
  description?: string;
  parameters?: JSONSchema7;
}

export type OpenAIItem =
  | OpenAIMessageItem
  | OpenAIFunctionCallItem
  | OpenAIFunctionCallOutputItem;

export interface OpenAIMessageItem {
  type: "message";
  role: "user" | "assistant" | "system";
  content: OpenAIContentPart[];
}

export interface OpenAIFunctionCallItem {
  type: "function_call";
  call_id: string;
  name: string;
  arguments: string;
}

export interface OpenAIFunctionCallOutputItem {
  type: "function_call_output";
  call_id: string;
  output: string;
}

export type OpenAIContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_audio"; audio: string }
  | { type: "output_text"; text: string }
  | { type: "output_audio"; audio: string; transcript?: string };
