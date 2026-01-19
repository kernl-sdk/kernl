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

