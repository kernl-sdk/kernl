---
layout: docs
---

# @kernl-sdk/protocol

> **For AI agents**: These reference docs help coding agents understand the kernl SDK. If your agent gets stuck, share this page with it.

Standard interfaces and types for AI model providers and realtime communication.

## Language Models

Type-safe interfaces for chat completion APIs:

```ts
import type { LanguageModel, LanguageModelMessage } from '@kernl-sdk/protocol';

const messages: LanguageModelMessage[] = [
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'Hello!' },
];
```

## Embedding Models

Interfaces for text embedding APIs:

```ts
import type { EmbeddingModel, EmbeddingResult } from '@kernl-sdk/protocol';
```

## Realtime

Protocol types for voice/streaming communication:

```ts
import type {
  RealtimeClientEvent,
  RealtimeServerEvent,
  SessionConfig,
} from '@kernl-sdk/protocol';
```

Standard interfaces and types for AI model providers.

## Classes

| Class | Description |
| ------ | ------ |
| [RealtimeError](classes/RealtimeError.md) | Error from a realtime session. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [AbortEvent](interfaces/AbortEvent.md) | Stream event indicating the agent execution was aborted. |
| [ActivityEndEvent](interfaces/ActivityEndEvent.md) | Client event to signal end of user activity (manual VAD). |
| [ActivityStartEvent](interfaces/ActivityStartEvent.md) | Client event to signal start of user activity (manual VAD). |
| [AssistantMessage](interfaces/AssistantMessage.md) | - |
| [AudioConfig](interfaces/AudioConfig.md) | Audio format configuration for input and output. |
| [AudioFormat](interfaces/AudioFormat.md) | Audio format specification. |
| [AudioInputAppendEvent](interfaces/AudioInputAppendEvent.md) | Client event to append audio to the input buffer. |
| [AudioInputClearedEvent](interfaces/AudioInputClearedEvent.md) | Server event confirming the audio input buffer has been cleared. |
| [AudioInputClearEvent](interfaces/AudioInputClearEvent.md) | Client event to clear the audio input buffer. |
| [AudioInputCommitEvent](interfaces/AudioInputCommitEvent.md) | Client event to commit the audio input buffer as a user message. |
| [AudioInputCommittedEvent](interfaces/AudioInputCommittedEvent.md) | Server event confirming the audio input buffer has been committed. |
| [AudioOutputDeltaEvent](interfaces/AudioOutputDeltaEvent.md) | Server event containing an audio output chunk. |
| [AudioOutputDoneEvent](interfaces/AudioOutputDoneEvent.md) | Server event indicating audio output is complete. |
| [DataPart](interfaces/DataPart.md) | Represents a structured data segment (e.g., JSON) within a message or artifact. |
| [EmbeddingModel](interfaces/EmbeddingModel.md) | Embedding model interface. |
| [EmbeddingModelRequest](interfaces/EmbeddingModelRequest.md) | - |
| [EmbeddingModelRequestSettings](interfaces/EmbeddingModelRequestSettings.md) | - |
| [EmbeddingModelResponse](interfaces/EmbeddingModelResponse.md) | The response from an embedding model. |
| [EmbeddingModelUsage](interfaces/EmbeddingModelUsage.md) | Usage information for an embedding model call. |
| [ErrorEvent](interfaces/ErrorEvent.md) | Stream event indicating an error occurred during execution. |
| [FilePartWithData](interfaces/FilePartWithData.md) | A file with inline data (base64 string or binary). |
| [FilePartWithUri](interfaces/FilePartWithUri.md) | A file referenced by URI. |
| [FinishEvent](interfaces/FinishEvent.md) | Stream event indicating the completion of agent execution. |
| [ItemCreatedEvent](interfaces/ItemCreatedEvent.md) | Server event indicating an item has been added to the conversation. |
| [ItemCreateEvent](interfaces/ItemCreateEvent.md) | Client event to add an item to the conversation. |
| [ItemDeletedEvent](interfaces/ItemDeletedEvent.md) | Server event indicating an item has been deleted. |
| [ItemDeleteEvent](interfaces/ItemDeleteEvent.md) | Client event to delete an item from the conversation. |
| [ItemTruncatedEvent](interfaces/ItemTruncatedEvent.md) | Server event indicating an item has been truncated. |
| [ItemTruncateEvent](interfaces/ItemTruncateEvent.md) | Client event to truncate assistant audio at a specific timestamp. |
| [LanguageModel](interfaces/LanguageModel.md) | Defines the standard interface for language model providers in kernl. |
| [LanguageModelFinishReason](interfaces/LanguageModelFinishReason.md) | Reason why a language model finished generating a response. |
| [LanguageModelItemBase](interfaces/LanguageModelItemBase.md) | Shared base for language model items. |
| [LanguageModelRequest](interfaces/LanguageModelRequest.md) | A request to a large language model. |
| [LanguageModelRequestSettings](interfaces/LanguageModelRequestSettings.md) | Settings to use when calling an LLM. |
| [LanguageModelResponse](interfaces/LanguageModelResponse.md) | The base response interface for a language model. |
| [LanguageModelResponseJSON](interfaces/LanguageModelResponseJSON.md) | JSON response format. |
| [LanguageModelResponseText](interfaces/LanguageModelResponseText.md) | Text response format. |
| [LanguageModelUsage](interfaces/LanguageModelUsage.md) | Usage information for a language model call. |
| [MessageBase](interfaces/MessageBase.md) | - |
| [ModelSettingsText](interfaces/ModelSettingsText.md) | - |
| [PartBase](interfaces/PartBase.md) | Defines base properties common to all message or artifact parts. |
| [Provider](interfaces/Provider.md) | Provider for language, text embedding, and image generation models. |
| [RawEvent](interfaces/RawEvent.md) | Stream event containing raw provider-specific data. |
| [RealtimeAuthenticateOptions](interfaces/RealtimeAuthenticateOptions.md) | Options for authenticating with a realtime provider. |
| [RealtimeChannel](interfaces/RealtimeChannel.md) | Base interface for audio I/O channels. |
| [RealtimeConnection](interfaces/RealtimeConnection.md) | An active bidirectional connection to a realtime model. |
| [RealtimeConnectOptions](interfaces/RealtimeConnectOptions.md) | - |
| [RealtimeEventBase](interfaces/RealtimeEventBase.md) | Base interface for all realtime events. |
| [RealtimeModel](interfaces/RealtimeModel.md) | A realtime model that can establish bidirectional streaming connections. |
| [RealtimeResponseConfig](interfaces/RealtimeResponseConfig.md) | Configuration for creating a response (for response.create event). |
| [RealtimeSession](interfaces/RealtimeSession.md) | A realtime session as returned from the server. |
| [RealtimeSessionConfig](interfaces/RealtimeSessionConfig.md) | Configuration for a realtime session. |
| [RealtimeTransport](interfaces/RealtimeTransport.md) | A transport factory for custom connection mechanisms (e.g., WebRTC). |
| [RealtimeUsage](interfaces/RealtimeUsage.md) | Token usage information for a response. |
| [Reasoning](interfaces/Reasoning.md) | Reasoning that the model has generated. |
| [ReasoningDeltaEvent](interfaces/ReasoningDeltaEvent.md) | Stream event containing a delta (chunk) of reasoning output. |
| [ReasoningEndEvent](interfaces/ReasoningEndEvent.md) | Stream event indicating the end of reasoning output. |
| [ReasoningStartEvent](interfaces/ReasoningStartEvent.md) | Stream event indicating the start of reasoning output. |
| [ResponseCancelEvent](interfaces/ResponseCancelEvent.md) | Client event to cancel an in-progress response. |
| [ResponseCreatedEvent](interfaces/ResponseCreatedEvent.md) | Server event indicating a response has been created. |
| [ResponseCreateEvent](interfaces/ResponseCreateEvent.md) | Client event to trigger a model response. |
| [ResponseDoneEvent](interfaces/ResponseDoneEvent.md) | Server event indicating a response is complete. |
| [ResponseInterruptedEvent](interfaces/ResponseInterruptedEvent.md) | Server event indicating a response has been interrupted. |
| [SessionCreatedEvent](interfaces/SessionCreatedEvent.md) | Server event indicating the session has been created. |
| [SessionErrorEvent](interfaces/SessionErrorEvent.md) | Server event indicating a session error. |
| [SessionResumeConfig](interfaces/SessionResumeConfig.md) | Configuration for resuming a previous session. |
| [SessionUpdatedEvent](interfaces/SessionUpdatedEvent.md) | Server event indicating the session configuration has been updated. |
| [SessionUpdateEvent](interfaces/SessionUpdateEvent.md) | Client event to update session configuration. |
| [SharedBase](interfaces/SharedBase.md) | - |
| [SpeechStartedEvent](interfaces/SpeechStartedEvent.md) | Server event indicating speech has been detected (VAD). |
| [SpeechStoppedEvent](interfaces/SpeechStoppedEvent.md) | Server event indicating speech has stopped (VAD). |
| [StartEvent](interfaces/StartEvent.md) | Stream event indicating the start of agent execution. |
| [StreamEventBase](interfaces/StreamEventBase.md) | Base interface for all stream events. |
| [SystemMessage](interfaces/SystemMessage.md) | - |
| [TextDeltaEvent](interfaces/TextDeltaEvent.md) | Stream event containing a delta (chunk) of text output. |
| [TextEndEvent](interfaces/TextEndEvent.md) | Stream event indicating the end of a text output. |
| [TextOutputDeltaEvent](interfaces/TextOutputDeltaEvent.md) | Server event containing a text output chunk. |
| [TextOutputEvent](interfaces/TextOutputEvent.md) | Server event containing the complete text output. |
| [TextPart](interfaces/TextPart.md) | Text that the model has generated. |
| [TextStartEvent](interfaces/TextStartEvent.md) | Stream event indicating the start of a text output. |
| [ToolCall](interfaces/ToolCall.md) | Tool calls that the model has generated. |
| [ToolCallEvent](interfaces/ToolCallEvent.md) | Server event indicating the model wants to call a tool. |
| [ToolCancelledEvent](interfaces/ToolCancelledEvent.md) | Server event indicating a tool call has been cancelled. |
| [ToolDeltaEvent](interfaces/ToolDeltaEvent.md) | Server event containing a tool call arguments chunk. |
| [ToolInputDeltaEvent](interfaces/ToolInputDeltaEvent.md) | Stream event containing a delta (chunk) of tool input. |
| [ToolInputEndEvent](interfaces/ToolInputEndEvent.md) | Stream event indicating the end of tool input generation. |
| [ToolInputStartEvent](interfaces/ToolInputStartEvent.md) | Stream event indicating the start of tool input generation. |
| [ToolResult](interfaces/ToolResult.md) | Result of a tool call that has been executed by the provider. |
| [ToolResultEvent](interfaces/ToolResultEvent.md) | Client event to submit a tool result. |
| [ToolStartEvent](interfaces/ToolStartEvent.md) | Server event indicating a tool call has started. |
| [TranscriptInputDeltaEvent](interfaces/TranscriptInputDeltaEvent.md) | Server event containing an input transcription chunk. |
| [TranscriptInputEvent](interfaces/TranscriptInputEvent.md) | Server event containing the complete input transcription. |
| [TranscriptOutputDeltaEvent](interfaces/TranscriptOutputDeltaEvent.md) | Server event containing an output transcription chunk. |
| [TranscriptOutputEvent](interfaces/TranscriptOutputEvent.md) | Server event containing the complete output transcription. |
| [TurnDetectionConfig](interfaces/TurnDetectionConfig.md) | Turn detection / VAD configuration. |
| [UserMessage](interfaces/UserMessage.md) | - |
| [VoiceConfig](interfaces/VoiceConfig.md) | Voice configuration for audio output. |
| [WebSocketLike](interfaces/WebSocketLike.md) | Minimal WebSocket interface matching the standard WebSocket API. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [ClientCredential](type-aliases/ClientCredential.md) | A client credential for browser-based realtime connections. |
| [Embedding](type-aliases/Embedding.md) | An embedding is a vector, i.e. an array of numbers. It is e.g. used to represent a text as a vector of word embeddings. |
| [FilePart](type-aliases/FilePart.md) | A file that has been generated by the model or referenced by URI. |
| [JSONArray](type-aliases/JSONArray.md) | - |
| [JSONObject](type-aliases/JSONObject.md) | - |
| [JSONValue](type-aliases/JSONValue.md) | A JSON value can be a string, number, boolean, object, array, or null. JSON values can be serialized and deserialized by the JSON.stringify and JSON.parse methods. |
| [LanguageModelFunctionTool](type-aliases/LanguageModelFunctionTool.md) | A tool has a name, a description, and a set of parameters. |
| [LanguageModelItem](type-aliases/LanguageModelItem.md) | - |
| [LanguageModelProviderTool](type-aliases/LanguageModelProviderTool.md) | The configuration of a tool that is defined by the provider. |
| [LanguageModelResponseItem](type-aliases/LanguageModelResponseItem.md) | A subset of LanguageModelItem that excludes items that wouldn't make sense for a model to generate (e.g. system/user messages, tool results). |
| [LanguageModelResponseType](type-aliases/LanguageModelResponseType.md) | Response format specification for language model output. |
| [LanguageModelStreamEvent](type-aliases/LanguageModelStreamEvent.md) | Union of all language model stream events. |
| [LanguageModelTool](type-aliases/LanguageModelTool.md) | - |
| [LanguageModelToolChoice](type-aliases/LanguageModelToolChoice.md) | - |
| [Message](type-aliases/Message.md) | - |
| [MessagePart](type-aliases/MessagePart.md) | - |
| [ModelSettingsReasoning](type-aliases/ModelSettingsReasoning.md) | Configuration options for model reasoning |
| [ModelSettingsReasoningEffort](type-aliases/ModelSettingsReasoningEffort.md) | Constrains effort on reasoning for [reasoning models](https://platform.openai.com/docs/guides/reasoning). |
| [RealtimeChannelEvents](type-aliases/RealtimeChannelEvents.md) | Events emitted by a realtime channel. |
| [RealtimeClientEvent](type-aliases/RealtimeClientEvent.md) | Union of all client → server events. |
| [RealtimeConnectionEvents](type-aliases/RealtimeConnectionEvents.md) | Events emitted by a realtime connection. |
| [RealtimeModality](type-aliases/RealtimeModality.md) | Output modality for realtime sessions. |
| [RealtimeServerEvent](type-aliases/RealtimeServerEvent.md) | Union of all server → client events. |
| [RealtimeToolChoice](type-aliases/RealtimeToolChoice.md) | Tool choice behavior for realtime sessions. |
| [ResponseStatus](type-aliases/ResponseStatus.md) | Status of a response. |
| [SharedProviderMetadata](type-aliases/SharedProviderMetadata.md) | Additional provider-specific metadata. |
| [SharedProviderOptions](type-aliases/SharedProviderOptions.md) | - |
| [SharedWarning](type-aliases/SharedWarning.md) | Warning from the model provider for this call. The call will proceed, but e.g. some settings might not be supported, which can lead to suboptimal results. |
| [ToolCallState](type-aliases/ToolCallState.md) | State of a tool call execution. |
| [TransportStatus](type-aliases/TransportStatus.md) | Status of a realtime transport connection. |
| [WebSocketConstructor](type-aliases/WebSocketConstructor.md) | WebSocket constructor type for cross-platform compatibility. |

## Variables

| Variable | Description |
| ------ | ------ |
| [COMPLETED](variables/COMPLETED.md) | - |
| [DEAD](variables/DEAD.md) | Task is being removed from the system. Final cleanup in progress, about to be fully deleted. |
| [FAILED](variables/FAILED.md) | - |
| [IN\_PROGRESS](variables/IN_PROGRESS.md) | Protocol Constants |
| [INTERRUPTIBLE](variables/INTERRUPTIBLE.md) | Task is sleeping/blocked, waiting for a condition. Can be woken up by: - The condition being met (e.g., approval granted) - A signal (e.g., user cancellation) |
| [RUNNING](variables/RUNNING.md) | Task is either: - Currently executing - In run queue waiting to be scheduled (might want to differentiate between running + queued here) |
| [STOPPED](variables/STOPPED.md) | Task has been stopped by a signal (SIGSTOP). Will remain stopped until explicitly continued (SIGCONT). |
| [UNINTERRUPTIBLE](variables/UNINTERRUPTIBLE.md) | Task is sleeping/blocked and CANNOT be interrupted by signals. Only wakes when the condition is met. |
| [WS\_CLOSED](variables/WS_CLOSED.md) | - |
| [WS\_CLOSING](variables/WS_CLOSING.md) | - |
| [WS\_CONNECTING](variables/WS_CONNECTING.md) | - |
| [WS\_OPEN](variables/WS_OPEN.md) | - |
| [ZOMBIE](variables/ZOMBIE.md) | Task has finished execution but hasn't been cleaned up yet. Waiting for parent to read exit status (wait/waitpid). |

## Functions

| Function | Description |
| ------ | ------ |
| [message](functions/message.md) | Create a message with text content |
| [reasoning](functions/reasoning.md) | Create a reasoning item |
