import { SharedProviderMetadata } from "@/provider";
import { LanguageModelItem } from "@/language-model";
import {
  RealtimeSession,
  RealtimeSessionConfig,
  RealtimeResponseConfig,
  RealtimeError,
  RealtimeUsage,
  ResponseStatus,
} from "./types";

/**
 * Base interface for all realtime events.
 */
export interface RealtimeEventBase {
  /**
   * Unique identifier for this event.
   */
  id?: string;

  /**
   * Provider-specific metadata.
   */
  providerMetadata?: SharedProviderMetadata;
}

/**
 * Union of all client → server events.
 */
export type RealtimeClientEvent =
  | SessionUpdateEvent
  | ItemCreateEvent
  | ItemDeleteEvent
  | ItemTruncateEvent
  | AudioInputAppendEvent
  | AudioInputCommitEvent
  | AudioInputClearEvent
  | ActivityStartEvent
  | ActivityEndEvent
  | ResponseCreateEvent
  | ResponseCancelEvent
  | ToolResultEvent;

/**
 * Union of all server → client events.
 */
export type RealtimeServerEvent =
  | SessionCreatedEvent
  | SessionUpdatedEvent
  | SessionErrorEvent
  | ItemCreatedEvent
  | ItemDeletedEvent
  | ItemTruncatedEvent
  | AudioInputCommittedEvent
  | AudioInputClearedEvent
  | SpeechStartedEvent
  | SpeechStoppedEvent
  | AudioOutputDeltaEvent
  | AudioOutputDoneEvent
  | TextOutputDeltaEvent
  | TextOutputEvent
  | TranscriptInputDeltaEvent
  | TranscriptInputEvent
  | TranscriptOutputDeltaEvent
  | TranscriptOutputEvent
  | ResponseCreatedEvent
  | ResponseInterruptedEvent
  | ResponseDoneEvent
  | ToolStartEvent
  | ToolDeltaEvent
  | ToolCallEvent
  | ToolCancelledEvent;

/**
 * Client event to update session configuration.
 */
export interface SessionUpdateEvent extends RealtimeEventBase {
  readonly kind: "session.update";
  config: RealtimeSessionConfig;
}

/**
 * Client event to add an item to the conversation.
 */
export interface ItemCreateEvent extends RealtimeEventBase {
  readonly kind: "item.create";
  item: LanguageModelItem;
  previousItemId?: string;
}

/**
 * Client event to delete an item from the conversation.
 */
export interface ItemDeleteEvent extends RealtimeEventBase {
  readonly kind: "item.delete";
  itemId: string;
}

/**
 * Client event to truncate assistant audio at a specific timestamp.
 */
export interface ItemTruncateEvent extends RealtimeEventBase {
  readonly kind: "item.truncate";
  itemId: string;
  audioEndMs: number;
}

/**
 * Client event to append audio to the input buffer.
 */
export interface AudioInputAppendEvent extends RealtimeEventBase {
  readonly kind: "audio.input.append";
  /**
   * Base64-encoded audio data.
   */
  audio: string;
}

/**
 * Client event to commit the audio input buffer as a user message.
 */
export interface AudioInputCommitEvent extends RealtimeEventBase {
  readonly kind: "audio.input.commit";
}

/**
 * Client event to clear the audio input buffer.
 */
export interface AudioInputClearEvent extends RealtimeEventBase {
  readonly kind: "audio.input.clear";
}

/**
 * Client event to signal start of user activity (manual VAD).
 */
export interface ActivityStartEvent extends RealtimeEventBase {
  readonly kind: "activity.start";
}

/**
 * Client event to signal end of user activity (manual VAD).
 */
export interface ActivityEndEvent extends RealtimeEventBase {
  readonly kind: "activity.end";
}

/**
 * Client event to trigger a model response.
 */
export interface ResponseCreateEvent extends RealtimeEventBase {
  readonly kind: "response.create";
  config?: RealtimeResponseConfig;
}

/**
 * Client event to cancel an in-progress response.
 */
export interface ResponseCancelEvent extends RealtimeEventBase {
  readonly kind: "response.cancel";
  responseId?: string;
}

/**
 * Server event indicating the session has been created.
 */
export interface SessionCreatedEvent extends RealtimeEventBase {
  readonly kind: "session.created";
  session: RealtimeSession;
}

/**
 * Server event indicating the session configuration has been updated.
 */
export interface SessionUpdatedEvent extends RealtimeEventBase {
  readonly kind: "session.updated";
  session: RealtimeSession;
}

/**
 * Server event indicating a session error.
 */
export interface SessionErrorEvent extends RealtimeEventBase {
  readonly kind: "session.error";
  error: RealtimeError;
}

/**
 * Server event indicating an item has been added to the conversation.
 */
export interface ItemCreatedEvent extends RealtimeEventBase {
  readonly kind: "item.created";
  item: LanguageModelItem;
  previousItemId?: string;
}

/**
 * Server event indicating an item has been deleted.
 */
export interface ItemDeletedEvent extends RealtimeEventBase {
  readonly kind: "item.deleted";
  itemId: string;
}

/**
 * Server event indicating an item has been truncated.
 */
export interface ItemTruncatedEvent extends RealtimeEventBase {
  readonly kind: "item.truncated";
  itemId: string;
  audioEndMs: number;
}

/**
 * Server event confirming the audio input buffer has been committed.
 */
export interface AudioInputCommittedEvent extends RealtimeEventBase {
  readonly kind: "audio.input.committed";
  itemId: string;
}

/**
 * Server event confirming the audio input buffer has been cleared.
 */
export interface AudioInputClearedEvent extends RealtimeEventBase {
  readonly kind: "audio.input.cleared";
}

/**
 * Server event indicating speech has been detected (VAD).
 */
export interface SpeechStartedEvent extends RealtimeEventBase {
  readonly kind: "speech.started";
  audioStartMs: number;
  itemId: string;
}

/**
 * Server event indicating speech has stopped (VAD).
 */
export interface SpeechStoppedEvent extends RealtimeEventBase {
  readonly kind: "speech.stopped";
  audioEndMs: number;
  itemId: string;
}

/**
 * Server event containing an audio output chunk.
 */
export interface AudioOutputDeltaEvent extends RealtimeEventBase {
  readonly kind: "audio.output.delta";
  responseId: string;
  itemId: string;
  /**
   * Base64-encoded audio chunk.
   */
  audio: string;
}

/**
 * Server event indicating audio output is complete.
 */
export interface AudioOutputDoneEvent extends RealtimeEventBase {
  readonly kind: "audio.output.done";
  responseId: string;
  itemId: string;
}

/**
 * Server event containing a text output chunk.
 */
export interface TextOutputDeltaEvent extends RealtimeEventBase {
  readonly kind: "text.output.delta";
  responseId: string;
  itemId: string;
  delta: string;
}

/**
 * Server event containing the complete text output.
 */
export interface TextOutputEvent extends RealtimeEventBase {
  readonly kind: "text.output";
  responseId: string;
  itemId: string;
  text: string;
}

/**
 * Server event containing an input transcription chunk.
 */
export interface TranscriptInputDeltaEvent extends RealtimeEventBase {
  readonly kind: "transcript.input.delta";
  itemId: string;
  delta: string;
}

/**
 * Server event containing the complete input transcription.
 */
export interface TranscriptInputEvent extends RealtimeEventBase {
  readonly kind: "transcript.input";
  itemId: string;
  text: string;
}

/**
 * Server event containing an output transcription chunk.
 */
export interface TranscriptOutputDeltaEvent extends RealtimeEventBase {
  readonly kind: "transcript.output.delta";
  responseId: string;
  itemId: string;
  delta: string;
}

/**
 * Server event containing the complete output transcription.
 */
export interface TranscriptOutputEvent extends RealtimeEventBase {
  readonly kind: "transcript.output";
  responseId: string;
  itemId: string;
  text: string;
}

/**
 * Server event indicating a response has been created.
 */
export interface ResponseCreatedEvent extends RealtimeEventBase {
  readonly kind: "response.created";
  responseId: string;
}

/**
 * Server event indicating a response has been interrupted.
 */
export interface ResponseInterruptedEvent extends RealtimeEventBase {
  readonly kind: "response.interrupted";
  responseId: string;
}

/**
 * Server event indicating a response is complete.
 */
export interface ResponseDoneEvent extends RealtimeEventBase {
  readonly kind: "response.done";
  responseId: string;
  status: ResponseStatus;
  usage?: RealtimeUsage;
}

/**
 * Server event indicating a tool call has started.
 */
export interface ToolStartEvent extends RealtimeEventBase {
  readonly kind: "tool.start";
  responseId: string;
  callId: string;
  toolId: string;
}

/**
 * Server event containing a tool call arguments chunk.
 */
export interface ToolDeltaEvent extends RealtimeEventBase {
  readonly kind: "tool.delta";
  callId: string;
  delta: string;
}

/**
 * Server event indicating the model wants to call a tool.
 */
export interface ToolCallEvent extends RealtimeEventBase {
  readonly kind: "tool.call";
  callId: string;
  toolId: string;
  arguments: string;
}

/**
 * Server event indicating a tool call has been cancelled.
 */
export interface ToolCancelledEvent extends RealtimeEventBase {
  readonly kind: "tool.cancelled";
  callId: string;
}

/**
 * Client event to submit a tool result.
 */
export interface ToolResultEvent extends RealtimeEventBase {
  readonly kind: "tool.result";
  callId: string;
  result?: string;
  error?: string;
}
