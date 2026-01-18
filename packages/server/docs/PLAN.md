# API Evolution Plan

## Current State: AI SDK Adapter Layer

The server API currently uses Vercel AI SDK types (`UIMessage`) for convenience during the transition period. These are marked with `x-note` in the OpenAPI spec and prefixed with `AISDK` in schema names.

### Adapter endpoints

| Endpoint                      | Purpose                           |
| ----------------------------- | --------------------------------- |
| `POST /threads/{tid}/stream`  | Stream to existing thread         |
| `GET /threads/{tid}/messages` | Get thread messages as UIMessages |

### Adapter types

- `AISDKStreamRequest` - Request body with UIMessage
- `AISDKMessageList` - Response with UIMessage array
- `UIMessage` - Vercel AI SDK message format

## Future: kernl-native types

The goal is to evolve toward kernl-native event types that are not coupled to any specific frontend SDK.

### Reserved Endpoints

| Endpoint                     | Purpose                    |
| ---------------------------- | -------------------------- |
| `POST /threads/{tid}/events` | Post kernl event to thread |
| `GET /threads/{tid}/events`  | Get thread events/history  |

### Planned Event Schema

```typescript
interface KernlEvent {
  id: string;
  tid: string;
  seq: number;
  timestamp: string;
  role: "user" | "assistant" | "system" | "tool";
  content: unknown; // kernl-native content types
  metadata: Record<string, unknown>;
}
```

## Migration Strategy

1. **Current**: Use `/messages` endpoints with AI SDK types
2. **Next**: Implement `/events` endpoints with kernl-native types
3. **Later**: Add adapters/converters for different frontend SDKs
4. **Eventually**: Deprecate AI SDK-specific endpoints (or keep as convenience layer)

The adapter layer will remain available for projects using the AI SDK, but the canonical API will be kernl-native.
