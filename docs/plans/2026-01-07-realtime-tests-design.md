# Realtime Module Test Design

## Overview

Add comprehensive unit tests for the realtime module (`packages/kernl/src/realtime/`), which currently has zero test coverage.

## Components

- **RealtimeAgent** - Stateless config extending BaseAgent
- **RealtimeSession** - Connection manager with audio I/O, tool execution, event routing
- **WebSocketTransport** - Custom WebSocket transport for Node.js <22

## Test Structure

```
packages/kernl/src/realtime/__tests__/
├── fixtures/
│   ├── mock-realtime-model.ts
│   ├── mock-connection.ts
│   └── mock-channel.ts
├── agent.test.ts
├── session.test.ts
└── transport.test.ts
```

## Mock Fixtures

### mock-realtime-model.ts
Factory returning mock `RealtimeModel`:
- `connect()` returns mock connection
- `provider` and `modelId` properties
- Configurable failure modes

### mock-connection.ts
Factory for `RealtimeConnection`:
- `send()` captures events for assertions
- `on()`/`emit()` simulates server events
- `close()`, `mute()`, `unmute()` tracked
- `status` property

### mock-channel.ts
Factory for `RealtimeChannel`:
- `on()`/`emit()` simulates audio input
- `sendAudio()`, `interrupt()`, `close()` tracked

## Test Coverage

### RealtimeAgent (agent.test.ts)
- Constructor: kind, model, voice config
- Inherited BaseAgent: id, name, instructions, toolkits
- Tool access: tool(), tools()

### WebSocketTransport (transport.test.ts)
- Constructor: handlesAudio, websocket storage
- connect(): delegation to model, websocket passing

### RealtimeSession (session.test.ts)

**Connection Lifecycle:**
- Constructor validation and config
- connect() with model/transport
- buildSessionConfig() output
- close() cleanup

**Event Routing:**
- Audio events (delta, done)
- Transcript events (input, output)
- Text events
- Error events
- Session lifecycle events
- Tool call routing

**Audio/Message I/O:**
- sendAudio(), commit(), sendMessage()
- interrupt(), mute(), unmute()
- Channel integration

**Tool Execution:**
- Tool lookup (found, not found, wrong type)
- Tool invocation with context
- Result/error handling
