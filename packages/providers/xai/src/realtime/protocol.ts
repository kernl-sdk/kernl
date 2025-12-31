import type { JSONSchema7 } from "json-schema";

/**
 * Grok (xAI) Realtime API wire types.
 *
 * Based on https://docs.x.ai/docs/guides/voice/agent
 */

// =============================================================================
// Client Events
// =============================================================================

export type GrokClientEvent =
  | GrokSessionUpdate
  | GrokInputAudioBufferAppend
  | GrokInputAudioBufferCommit
  | GrokInputAudioBufferClear
  | GrokConversationItemCreate
  | GrokResponseCreate;

export interface GrokSessionUpdate {
  type: "session.update";
  session: GrokSessionConfig;
}

export interface GrokInputAudioBufferAppend {
  type: "input_audio_buffer.append";
  audio: string;
}

export interface GrokInputAudioBufferCommit {
  type: "input_audio_buffer.commit";
}

export interface GrokInputAudioBufferClear {
  type: "input_audio_buffer.clear";
}

export interface GrokConversationItemCreate {
  type: "conversation.item.create";
  item: GrokItem;
  previous_item_id?: string;
}

export interface GrokResponseCreate {
  type: "response.create";
}

// =============================================================================
// Server Events
// =============================================================================

export type GrokServerEvent =
  | GrokConversationCreated
  | GrokSessionUpdated
  | GrokInputAudioBufferCommitted
  | GrokInputAudioBufferCleared
  | GrokInputAudioBufferSpeechStarted
  | GrokInputAudioBufferSpeechStopped
  | GrokConversationItemAdded
  | GrokConversationItemInputAudioTranscriptionCompleted
  | GrokResponseCreated
  | GrokResponseOutputItemAdded
  | GrokResponseDone
  | GrokResponseOutputAudioDelta
  | GrokResponseOutputAudioDone
  | GrokResponseOutputAudioTranscriptDelta
  | GrokResponseOutputAudioTranscriptDone
  | GrokResponseFunctionCallArgumentsDone;

export interface GrokConversationCreated {
  type: "conversation.created";
  event_id: string;
  conversation: {
    id: string;
    object: "realtime.conversation";
  };
}

export interface GrokSessionUpdated {
  type: "session.updated";
  event_id: string;
  session: GrokSession;
}

export interface GrokInputAudioBufferCommitted {
  type: "input_audio_buffer.committed";
  event_id: string;
  previous_item_id?: string;
  item_id: string;
}

export interface GrokInputAudioBufferCleared {
  type: "input_audio_buffer.cleared";
  event_id: string;
}

export interface GrokInputAudioBufferSpeechStarted {
  type: "input_audio_buffer.speech_started";
  event_id: string;
  item_id: string;
}

export interface GrokInputAudioBufferSpeechStopped {
  type: "input_audio_buffer.speech_stopped";
  event_id: string;
  item_id: string;
}

export interface GrokConversationItemAdded {
  type: "conversation.item.added";
  event_id: string;
  previous_item_id?: string;
  item: GrokItemWithId;
}

export interface GrokConversationItemInputAudioTranscriptionCompleted {
  type: "conversation.item.input_audio_transcription.completed";
  event_id: string;
  item_id: string;
  transcript: string;
}

export interface GrokResponseCreated {
  type: "response.created";
  event_id: string;
  response: {
    id: string;
    object: "realtime.response";
    status: "in_progress";
    output: unknown[];
  };
}

export interface GrokResponseOutputItemAdded {
  type: "response.output_item.added";
  event_id: string;
  response_id: string;
  output_index: number;
  item: GrokItemWithId;
}

export interface GrokResponseDone {
  type: "response.done";
  event_id: string;
  response: {
    id: string;
    object: "realtime.response";
    status: "completed" | "cancelled" | "failed";
  };
}

export interface GrokResponseOutputAudioDelta {
  type: "response.output_audio.delta";
  event_id: string;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
}

export interface GrokResponseOutputAudioDone {
  type: "response.output_audio.done";
  event_id: string;
  response_id: string;
  item_id: string;
}

export interface GrokResponseOutputAudioTranscriptDelta {
  type: "response.output_audio_transcript.delta";
  event_id: string;
  response_id: string;
  item_id: string;
  delta: string;
}

export interface GrokResponseOutputAudioTranscriptDone {
  type: "response.output_audio_transcript.done";
  event_id: string;
  response_id: string;
  item_id: string;
}

export interface GrokResponseFunctionCallArgumentsDone {
  type: "response.function_call_arguments.done";
  event_id: string;
  response_id?: string;
  item_id?: string;
  call_id: string;
  name: string;
  arguments: string;
}

// =============================================================================
// Shared Types
// =============================================================================

export interface GrokSession {
  instructions?: string;
  voice?: GrokVoice;
  turn_detection?: GrokTurnDetection;
}

export interface GrokSessionConfig {
  instructions?: string;
  voice?: GrokVoice;
  turn_detection?: GrokTurnDetection | null;
  audio?: GrokAudioConfig;
  tools?: GrokTool[];
}

/**
 * Available Grok voices.
 */
export type GrokVoice = "Ara" | "Rex" | "Sal" | "Eve" | "Leo";

export interface GrokTurnDetection {
  type: "server_vad" | null;
}

export interface GrokAudioConfig {
  input?: {
    format?: GrokAudioFormat;
  };
  output?: {
    format?: GrokAudioFormat;
  };
}

export interface GrokAudioFormat {
  type: "audio/pcm" | "audio/pcmu" | "audio/pcma";
  rate?: number;
}

export type GrokTool =
  | GrokFunctionTool
  | GrokWebSearchTool
  | GrokXSearchTool
  | GrokFileSearchTool;

export interface GrokFunctionTool {
  type: "function";
  name: string;
  description?: string;
  parameters?: JSONSchema7;
}

export interface GrokWebSearchTool {
  type: "web_search";
}

export interface GrokXSearchTool {
  type: "x_search";
  allowed_x_handles?: string[];
}

export interface GrokFileSearchTool {
  type: "file_search";
  vector_store_ids: string[];
  max_num_results?: number;
}

export type GrokItem = GrokMessageItem | GrokFunctionCallOutputItem;

export interface GrokMessageItem {
  type: "message";
  role: "user" | "assistant";
  content: GrokContentPart[];
}

export interface GrokFunctionCallOutputItem {
  type: "function_call_output";
  call_id: string;
  output: string;
}

export type GrokItemWithId = GrokItem & {
  id: string;
  object: "realtime.item";
  status: "completed" | "in_progress";
};

export type GrokContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_audio"; transcript?: string };
