# Popcorn HTTP Contract (Kernl-Native)

This document defines the HTTP API for Popcorn clients, using kernl-native terminology and concepts.

---

## Migration / Phased Development (Adapter-First)

Popcorn UI code is currently copied from OpenCode and expects the OpenCode HTTP + SSE contract. We will ship in phases:

- **Phase 1 (Adapter MVP)**: run an **OpenCode-compat adapter server** so the copied UI works unchanged. Internally, that adapter maps OpenCode sessions/messages/parts/events onto kernl threads/events/streams.
- **Phase 2 (KNP/0.1)**: stabilize the kernl-native **core loop** contract (threads + runs + replayable SSE + approvals + basic agents/providers/files). This is what kernl-native clients should build against first.
- **Phase 3 (KNP/0.2+)**: extend the kernl-native contract with “workspace services” (PTY/projects/worktrees/config/commands/diff/todos/LSP/MCP/etc.) and gradually migrate UI clients off the adapter.

This document includes:
- **KNP/0.1**: the MVP kernl-native protocol (core loop).
- **KNP/0.2 (Draft)**: a planned, additive extension for workspace services.

---

## Overview

- **Transport**: HTTP/1.1 (default port 4096)
- **Streaming**: Server-Sent Events (SSE) for real-time updates
- **Content-Type**: `application/json` for requests/responses, `text/event-stream` for SSE
- **Namespace Context**: Requests scoped via `?namespace=` query param or `x-kernl-namespace` header

---

## Protocol Versioning

This document defines the **Kernl-Native Popcorn Protocol** (**KNP**) for Popcorn clients.

- **Protocol ID**: `knp`
- **Protocol Version**: `0.1` (current; pre-1.0; backwards-incompatible changes may occur)
- **Server Discovery**: `GET /health` returns `protocol: { id, version }`
- **Client Opt-In**: clients SHOULD send `x-kernl-protocol: knp/0.1`

Compatibility rules:
- **Minor bumps** MAY add fields/endpoints/events but MUST remain backwards compatible.
- **Major bumps** MAY remove/rename semantics and require client changes.

---

## Core Concepts

| Concept | Description |
|---------|-------------|
| **Thread** | A conversation with an agent. Contains ordered events. |
| **Event** | An item in a thread: message, tool.call, tool.result, reasoning, etc. |
| **Agent** | A configured AI agent with instructions, model, and tools. |
| **Execution** | A thread transitions from stopped→running→stopped as it processes input. |

---

## SSE Event Stream

### Subscribe
```
GET /events
```

Returns `text/event-stream`.

**Scoping**
- `scope=namespace` (default): emit events for the current namespace (from `?namespace=` or `x-kernl-namespace`)
- `scope=global`: emit cross-namespace events (projects, global lifecycle, etc.)

**Replay / resume**
- Clients SHOULD reconnect using the SSE `Last-Event-ID` header.
- Alternatively, clients MAY pass `?after=<seq>` to resume from a known cursor.

**Query params**
- `scope`: `namespace | global` (default `namespace`)
- `namespace`: when `scope=namespace`
- `kinds`: optional comma-separated allowlist, e.g. `kinds=run.started,text.delta`
- `after`: optional integer cursor to resume (exclusive)

### Event Envelope
```json
{
  "seq": 123,
  "id": "evt_01ABC...",
  "scope": "namespace",
  "namespace": "default",
  "kind": "event.kind",
  "data": { ... },
  "timestamp": 1736683070123
}
```

Notes:
- `seq` is a **monotonic** per-scope cursor suitable for replay/dedupe.
- Servers SHOULD also set the SSE `id:` field to `seq` so `Last-Event-ID` works.
- `id` is a stable unique identifier for this emitted event envelope (useful for cross-stream dedupe).
- `timestamp` is milliseconds since epoch.

### Connection Events
| Kind | Data | Description |
|------|------|-------------|
| `connected` | `{}` | Sent on connection |
| `heartbeat` | `{}` | Keep-alive every 30s |

### Thread Events
| Kind | Data | Description |
|------|------|-------------|
| `thread.created` | `{ thread }` | New thread |
| `thread.updated` | `{ thread }` | Thread metadata changed |
| `thread.deleted` | `{ tid }` | Thread removed |

### Thread Lifecycle Events
| Kind | Data | Description |
|------|------|-------------|
| `thread.start` | `{ tid, agentId, namespace }` | Thread execution started |
| `thread.stop` | `{ tid, agentId, state, result?, error? }` | Thread execution ended |

### Model Call Events
| Kind | Data | Description |
|------|------|-------------|
| `model.call.start` | `{ tid, provider, modelId, agentId }` | LLM invocation began |
| `model.call.end` | `{ tid, provider, modelId, finishReason, usage? }` | LLM invocation ended |

### Stream Events (during execution)
| Kind | Data | Description |
|------|------|-------------|
| `text.start` | `{ tid, id }` | Text generation started |
| `text.delta` | `{ tid, id, delta }` | Text chunk |
| `text.end` | `{ tid, id, text }` | Text complete |
| `reasoning.start` | `{ tid, id }` | Reasoning started |
| `reasoning.delta` | `{ tid, id, delta }` | Reasoning chunk |
| `reasoning.end` | `{ tid, id, text }` | Reasoning complete |
| `tool.start` | `{ tid, callId, toolId }` | Tool call started |
| `tool.input.delta` | `{ tid, callId, delta }` | Tool input streaming |
| `tool.input.end` | `{ tid, callId, input }` | Tool input complete |
| `tool.result` | `{ tid, callId, result, error }` | Tool execution done |

### Approval Events
| Kind | Data | Description |
|------|------|-------------|
| `approval.requested` | `{ id, tid, callId, tool, input }` | Tool needs user approval |
| `approval.resolved` | `{ id, decision }` | User responded |

### Event Persistence
| Kind | Data | Description |
|------|------|-------------|
| `event.created` | `{ tid, event }` | New event persisted to thread |
| `event.updated` | `{ tid, event }` | Event modified |

### Workspace Events (namespace-scoped unless noted)
| Kind | Data | Description |
|------|------|-------------|
| `file.watcher.updated` | `{ path, type }` | File system change detected (`type`: `created|modified|deleted`) |
| `vcs.branch.updated` | `{ branch }` | Git branch changed |
| `lsp.updated` | `{}` | LSP servers status changed |
| `lsp.diagnostics` | `{ uri, diagnostics }` | Diagnostics updated for a file |
| `project.updated` | `{ project }` | Project metadata changed (global or namespace) |
| `pty.created` | `{ pty }` | PTY created |
| `pty.updated` | `{ pty }` | PTY metadata/size updated |
| `pty.exited` | `{ id, exitCode }` | PTY exited |
| `pty.deleted` | `{ id }` | PTY removed |
| `todo.updated` | `{ tid, todos }` | Todo list changed for a thread |
| `thread.diff.updated` | `{ tid, diffs }` | Diff summary changed for a thread |
| `mcp.tools.changed` | `{}` | MCP tools list changed |

---

## REST Endpoints

### Health

```
GET /health
```

**Response:**
```json
{
  "ok": true,
  "version": "1.0.0",
  "protocol": { "id": "knp", "version": "0.1" }
}
```

---

### Threads

#### List Threads
```
GET /threads
```

**Query Params:**
- `namespace` - Filter by namespace
- `agent_id` - Filter by agent
- `state` - Filter by state: `running`, `idle`, `stopped`
- `limit` - Max results (default 50)
- `cursor` - Pagination cursor

**Response:**
```json
{
  "threads": [
    {
      "tid": "thr_01ABC...",
      "namespace": "default",
      "title": "Help with auth",
      "agentId": "coder",
      "model": { "provider": "anthropic", "modelId": "claude-sonnet-4-20250514" },
      "state": "idle",
      "parentTaskId": null,
      "createdAt": "2025-01-12T10:00:00Z",
      "updatedAt": "2025-01-12T10:05:00Z",
      "metadata": {}
    }
  ],
  "next": "cursor_xyz..."
}
```

#### Create Thread
```
POST /threads
```

**Body:**
```json
{
  "agentId": "coder",
  "namespace": "default",
  "title": "Optional title",
  "model": {
    "provider": "anthropic",
    "modelId": "claude-sonnet-4-20250514"
  },
  "context": {},
  "metadata": {}
}
```

**Response:** Thread object

#### Get Thread
```
GET /threads/:tid
```

**Query Params:**
- `history` - Include event history: `true` or `{ limit, after, kinds }`

**Response:**
```json
{
  "tid": "thr_01ABC...",
  "namespace": "default",
  "title": "Help with auth",
  "agentId": "coder",
  "model": { "provider": "anthropic", "modelId": "claude-sonnet-4-20250514" },
  "state": "idle",
  "createdAt": "2025-01-12T10:00:00Z",
  "updatedAt": "2025-01-12T10:05:00Z",
  "history": [ ... ]  // if requested
}
```

#### Update Thread
```
PATCH /threads/:tid
```

**Body:**
```json
{
  "title": "New title",
  "metadata": { "archived": true }
}
```

#### Delete Thread
```
DELETE /threads/:tid
```

#### Fork Thread
```
POST /threads/:tid/fork
```

**Body:**
```json
{
  "afterSeq": 5,  // Fork after this sequence number
  "title": "Forked thread"
}
```

**Response:** New thread object

---

### Thread History

#### Get Events
```
GET /threads/:tid/events
```

**Query Params:**
- `after` - Only events with seq > this value
- `limit` - Max events (default 100)
- `order` - `asc` or `desc` (default `desc`)
- `kinds` - Filter by event kinds: `message,tool.call,tool.result`

**Response:**
```json
{
  "events": [
    {
      "id": "evt_01ABC...",
      "tid": "thr_01ABC...",
      "seq": 1,
      "kind": "message",
      "role": "user",
      "content": [
        { "kind": "text", "text": "Help me with auth" }
      ],
      "timestamp": "2025-01-12T10:00:00Z",
      "metadata": {}
    },
    {
      "id": "evt_02DEF...",
      "tid": "thr_01ABC...",
      "seq": 2,
      "kind": "message",
      "role": "assistant",
      "content": [
        { "kind": "text", "text": "I'll help you..." }
      ],
      "timestamp": "2025-01-12T10:00:05Z",
      "metadata": { "parentSeq": 1 }
    },
    {
      "id": "evt_03GHI...",
      "tid": "thr_01ABC...",
      "seq": 3,
      "kind": "tool.call",
      "callId": "call_xyz",
      "toolId": "read_file",
      "arguments": "{\"path\": \"src/auth.ts\"}",
      "state": "completed",
      "timestamp": "2025-01-12T10:00:06Z",
      "metadata": { "parentSeq": 1 }
    }
  ],
  "hasMore": false
}
```

---

### Runs

#### Send Message (Start Run)
```
POST /threads/:tid/runs
```

**Body:**
```json
{
  "input": [
    { "kind": "text", "text": "Help me implement login" },
    { "kind": "file", "uri": "file:///path/to/file.ts", "mimeType": "text/plain" }
  ],
  "agentId": "coder",  // optional, override thread's agent
  "model": {           // optional, override thread's model
    "provider": "anthropic",
    "modelId": "claude-sonnet-4-20250514"
  }
}
```

**Response:** Streams events, final response:
```json
{
  "runId": "run_01ABC...",
  "tid": "thr_01ABC...",
  "status": "completed",
  "usage": {
    "inputTokens": 1500,
    "outputTokens": 800,
    "reasoningTokens": 0,
    "cacheRead": 1000,
    "cacheWrite": 500,
    "cost": 0.015
  }
}
```

#### Abort Run
```
POST /threads/:tid/runs/abort
```

**Response:**
```json
{ "aborted": true }
```

#### Get Run Status
```
GET /threads/:tid/runs/current
```

**Response:**
```json
{
  "runId": "run_01ABC...",
  "status": "running",  // running | completed | failed | aborted
  "startedAt": "2025-01-12T10:00:00Z"
}
```

---

### Approvals

#### List Pending
```
GET /approvals
```

**Response:**
```json
{
  "approvals": [
    {
      "id": "apr_01ABC...",
      "tid": "thr_01ABC...",
      "callId": "call_xyz",
      "tool": {
        "id": "bash",
        "name": "Execute Command"
      },
      "input": { "command": "rm -rf node_modules" },
      "createdAt": "2025-01-12T10:00:00Z"
    }
  ]
}
```

#### Respond to Approval
```
POST /approvals/:id
```

**Body:**
```json
{
  "decision": "allow",  // allow | deny | allow-always | deny-always
  "message": "Optional explanation if denied"
}
```

---

### Agents

#### List Agents
```
GET /agents
```

**Response:**
```json
{
  "agents": [
    {
      "id": "coder",
      "name": "Coder",
      "description": "General coding assistant",
      "model": { "provider": "anthropic", "modelId": "claude-sonnet-4-20250514" }
    },
    {
      "id": "planner",
      "name": "Planner",
      "description": "Read-only planning agent"
    }
  ]
}
```

---

### Providers

#### List Providers
```
GET /providers
```

**Response:**
```json
{
  "providers": [
    {
      "id": "anthropic",
      "name": "Anthropic",
      "connected": true,
      "models": [
        {
          "id": "claude-sonnet-4-20250514",
          "name": "Claude Sonnet 4",
          "capabilities": {
            "reasoning": false,
            "vision": true,
            "tools": true
          }
        }
      ]
    }
  ],
  "default": {
    "provider": "anthropic",
    "modelId": "claude-sonnet-4-20250514"
  }
}
```

---

### Files

#### List Directory
```
GET /files?path=/src
```

**Response:**
```json
{
  "entries": [
    { "name": "index.ts", "path": "/src/index.ts", "type": "file" },
    { "name": "utils", "path": "/src/utils", "type": "directory" }
  ]
}
```

#### Read File
```
GET /files/content?path=/src/index.ts
```

**Response:**
```json
{
  "path": "/src/index.ts",
  "content": "export function main() { ... }",
  "mimeType": "text/typescript"
}
```

#### Search Files
```
GET /files/search?query=auth&type=file&limit=20
```

#### Search Content
```
GET /files/grep?pattern=TODO&glob=**/*.ts
```

---

## Event Kinds Reference

Events stored in thread history use these `kind` values:

| Kind | Description | Key Fields |
|------|-------------|------------|
| `message` | User or assistant message | `role`, `content[]` |
| `reasoning` | Model reasoning/thinking | `text` |
| `tool.call` | Tool invocation | `callId`, `toolId`, `arguments`, `state` |
| `tool.result` | Tool execution result | `callId`, `result`, `error` |

### Content Part Kinds (within messages)

| Kind | Description | Fields |
|------|-------------|--------|
| `text` | Text content | `text` |
| `file` | File attachment | `uri`, `mimeType`, `filename` |
| `data` | Structured data | `data` |

---

## Client-Side Rendering

The UI may derive presentation concepts from events:

```typescript
// Derive "turns" from events
function eventsToTurns(events: Event[]): Turn[] {
  // Group: user message + all following assistant events until next user message
}

// Derive "parts" for rendering
function eventToParts(event: Event): Part[] {
  if (event.kind === 'message') {
    return event.content.map(c => ({ kind: c.kind, ...c }));
  }
  if (event.kind === 'tool.call') {
    return [{ kind: 'tool', toolId: event.toolId, state: event.state, ... }];
  }
  // etc.
}
```

This keeps the contract clean (kernl-native) while allowing rich UI presentation.

---

## Error Format

```json
{
  "error": {
    "code": "not_found",
    "message": "Thread not found"
  }
}
```

| Code | Status | Description |
|------|--------|-------------|
| `not_found` | 404 | Resource doesn't exist |
| `invalid_request` | 400 | Malformed request |
| `conflict` | 409 | Resource state conflict (e.g., thread busy) |
| `unauthorized` | 401 | Auth required |
| `internal` | 500 | Server error |

---

## Migration from OpenCode Contract

| OpenCode | Kernl-Native |
|----------|--------------|
| `/session` | `/threads` |
| `/session/:id/message` | `/threads/:tid/runs` |
| `sessionID` | `tid` |
| `projectID` | `namespace` |
| `message.parentID` | `event.metadata.parentSeq` |
| `Part` types | Derived client-side from `Event` |
| `message.part.updated` SSE | `text.delta`, `tool.start`, etc. |
| `session.status` | `run.started`, `run.finished` |
| `permission.*` | `approval.*` |

---

## KNP/0.2 (Draft) — Workspace Services Extension

This section is a **planned additive extension** to KNP/0.1. It is intended to cover the “app shell” capabilities that the OpenCode UI expects (projects/worktrees, PTY, config, commands, etc.), but with kernl-native naming and stable semantics.

Status:
- **Draft**: shapes may change.
- **Additive intent**: KNP/0.2 should not break KNP/0.1 clients.

### Goals
- Provide a kernl-owned replacement for the OpenCode “workspace services” surface area.
- Keep the **core loop** (threads/events/runs) clean and stable.
- Allow multi-project UIs via a **global stream** (`GET /events?scope=global`) + namespace-scoped streams.

### Scope decision
KNP/0.2 adds endpoints that are *not strictly LLM protocol*, but are required for a full IDE-like UI experience.

---

### 0.2 REST Endpoints (Draft)

#### Health & Lifecycle
- **(Already in 0.1)** `GET /health`
- **(Optional 0.2)** `POST /dispose` — dispose server instance(s) (useful for desktop app lifecycle)

#### Path & VCS
- **`GET /path`** — return `home/state/config/worktree/directory`
- **`GET /vcs`** — return `{ branch }`

#### Projects
- **`GET /projects`** *(global)* — list known projects/workspaces
- **`GET /projects/current`** *(namespace-scoped)* — return current project for the namespace
- **`PATCH /projects/:projectId`** *(global)* — update name/icon/metadata

#### Worktrees
- **`GET /worktrees`** *(namespace-scoped)* — list worktrees for the current project
- **`POST /worktrees`** — create a new worktree

Draft `POST /worktrees` body:
```json
{ "directory": "/path/to/project" }
```

Draft response:
```json
{ "directory": "/path/to/project/.worktrees/xyz" }
```

#### Config
- **`GET /config`** — fetch server config (models, permissions, UI prefs)
- **`PATCH /config`** — update config (JSON merge recommended)

#### Commands
- **`GET /commands`** — list supported commands (slash commands)
- **`POST /threads/:tid/command`** — execute a command in a thread context *(optional; alternative to “message input starts with /”)*

#### Shell
- **`POST /threads/:tid/shell`** — execute a shell command (non-PTY), optionally streaming output via SSE

Draft body:
```json
{ "command": "pnpm test", "cwd": "/path/to/project" }
```

#### Files (extend 0.1 as needed)
- **(Already in 0.1)** `/files/*`
- **(Optional 0.2)** `GET /files/status` — git status / file status summary
- **(Optional 0.2)** `POST /files/write` — write file contents (if kernl-native wants to support direct writes)

#### Thread Review / State
- **`GET /threads/:tid/diff`**
- **`GET /threads/:tid/todos`**
- **`POST /threads/:tid/revert`**
- **`POST /threads/:tid/unrevert`**
- **`POST /threads/:tid/summarize`**
- **`POST /threads/:tid/share`**
- **`DELETE /threads/:tid/share`**

#### PTY (Terminal)
- **`GET /pty`** — list PTYs
- **`POST /pty`** — create PTY
- **`GET /pty/:ptyId`** — get PTY
- **`PUT /pty/:ptyId`** — update title/size
- **`DELETE /pty/:ptyId`** — delete PTY
- **`GET /pty/:ptyId/connect`** — WebSocket upgrade for terminal I/O

#### LSP
- **`GET /lsp`** — list LSP servers / status
- **`GET /lsp/diagnostics?uri=`** *(optional helper; SSE preferred)*

#### MCP
- **`GET /mcp`** — list MCP servers + status
- **`POST /mcp`** — add server
- **`POST /mcp/:name/connect`**, **`POST /mcp/:name/disconnect`**
- **OAuth/Auth** (if applicable): `POST /mcp/:name/auth`, `POST /mcp/:name/auth/callback`, `DELETE /mcp/:name/auth`

#### Logging
- **`POST /log`** — write log entry

---

### 0.2 SSE Events (Draft)

KNP/0.1 already enumerates workspace-related event kinds. KNP/0.2 clarifies that these are **first-class** and ties them to the endpoints above:

- **Projects/worktrees**: `project.updated`
- **PTY**: `pty.created`, `pty.updated`, `pty.exited`, `pty.deleted`
- **File watcher**: `file.watcher.updated`
- **VCS**: `vcs.branch.updated`
- **LSP**: `lsp.updated`, `lsp.diagnostics`
- **MCP**: `mcp.tools.changed`
- **Thread review**: `todo.updated`, `thread.diff.updated`

---

### 0.2 Minimum “Direct-to-KNP UI” Subset (if/when we migrate off adapter)

If we decide to have the UI call kernl-native endpoints directly (no OpenCode adapter), the minimum set usually becomes:
- Core: `/events`, `/threads/*`, `/agents`, `/providers`, `/files/*`, `/approvals`
- Shell: `/path`, `/projects`, `/projects/current`, `/pty/*`

Everything else can remain optional until the corresponding UI panels are migrated.
