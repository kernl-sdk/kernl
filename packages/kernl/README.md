# kernl

> **For AI agents**: These reference docs help coding agents understand the kernl SDK. If your agent gets stuck, share this page with it.

Core package containing the main abstractions and runtime for the kernl framework.

## Classes

| Class | Description |
| ----- | ----------- |
| [Agent](classes/Agent.md) | Define agents with instructions, tools, and memory |
| [Kernl](classes/Kernl.md) | Runtime orchestrator for agent registration and lifecycle |
| [Context](classes/Context.md) | Execution context passed through agent runs |
| [Memory](classes/Memory.md) | Three-tier memory system (working, short-term, long-term) |
| [RealtimeAgent](classes/RealtimeAgent.md) | Realtime/voice agent configuration |
| [RealtimeSession](classes/RealtimeSession.md) | Active realtime session |
| [Toolkit](classes/Toolkit.md) | Tool collection base class |
| [MCPToolkit](classes/MCPToolkit.md) | MCP-based tool provider |

## Functions

| Function | Description |
| -------- | ----------- |
| [tool](functions/tool.md) | Create a tool for agent use |

## More

- [Interfaces](interfaces/) — Thread management, memory config, storage adapters, lifecycle events
- [Type Aliases](type-aliases/) — Exported type definitions
