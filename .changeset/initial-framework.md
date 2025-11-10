---
"@kernl/core": minor
"@kernl/cli": minor
---

Initial implementation of Kernl agent framework (v0.1.0)

This release implements the core architecture for building agentic applications with a Linux kernel-inspired design:

**Core Agent Framework:**
- Agent class with instructions, model configuration, tools, and guardrails
- Thread execution loop with tick-based model interaction
- Context management for passing data between components
- Lifecycle hooks for extensibility

**Thread Execution:**
- Multi-turn conversation handling with tool calls
- Parallel tool execution support
- Terminal state detection
- State tracking (tick counter, model responses, history)

**Tool System:**
- Function tool definition with Zod schema validation
- Toolkit for managing collections of tools
- MCP (Model Context Protocol) server integration (stdio, HTTP, SSE transports)
- Tool approval workflow support
- Error handling with custom error functions

**Infrastructure:**
- Language model interface and provider registry
- Serialization system (codec, JSON, thread, tool)
- Tracing and observability hooks
- Usage tracking
- Input/output guardrails

**Testing:**
- Comprehensive test suite for Thread class (13 tests)
- Tool and toolkit test coverage
- Mock language model for testing

This is the foundational "Hello World" implementation - a working agent that can execute tool calls and maintain conversation history.
