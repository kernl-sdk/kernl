# Kernl Server API Specification

## Conventions

### Naming
- All field names use **camelCase** (e.g., `agentId`, `createdAt`)
- Query parameters use **camelCase** (e.g., `?agentId=...`)
- Path parameters use **ID suffix** (e.g., `{tid}`, `{agentID}`)

### Timestamps
All timestamps are **ISO-8601** format: `2024-01-15T09:30:00.000Z`

### Pagination
List endpoints support cursor-based pagination:
```
GET /threads?limit=20&cursor=abc123
```
Response includes `next` cursor (null if no more results).

### Errors
All errors return:
```json
{
  "error": {
    "code": "not_found",
    "message": "Thread not found"
  }
}
```

| Code | HTTP Status |
|------|-------------|
| `validation_error` | 400 |
| `unauthorized` | 401 |
| `not_found` | 404 |
| `internal_error` | 500 |

### Success Responses
Mutations return:
```json
{ "success": true }
```

### Streaming
Endpoints marked as streaming return **Server-Sent Events (SSE)**:
```
Content-Type: text/event-stream
```

---

## Health

### `GET /health`

Get health.

Get health information about the kernl server.

**Response**
```json
{
  "healthy": true,
  "version": "string"
}
```

---

## Agents

### `GET /agents`

List agents.

Get a list of all available AI agents in the kernl system.

**Response**
```json
{
  "agents": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "model": {
        "provider": null,
        "modelId": null
      },
      "memory": true,
      "toolkits": [
        "string"
      ]
    }
  ]
}
```

---

### `GET /agents/{agentID}`

Get agent.

Retrieve a specific agent by ID.

**Path Parameters**
- `agentID` — Agent ID

**Response**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "model": {
    "provider": "string",
    "modelId": "string"
  },
  "memory": true,
  "toolkits": [
    "string"
  ]
}
```

---

### `POST /agents/{agentID}/stream`

Stream agent execution.

Send a message to an agent and stream the response. Creates the thread if it doesn't exist.

**Path Parameters**
- `agentID` — Agent ID

**Request Body**
```json
{
  "tid": "string",
  "message": {},
  "title": "string",
  "titlerAgentId": "string"
}
```

---

## Threads

### `GET /threads`

List threads.

Get a list of all kernl threads, sorted by most recently updated.

**Query Parameters**
- `agentId` (optional) — Filter by agent ID
- `limit` (optional) — Max results
- `cursor` (optional) — Pagination cursor

**Response**
```json
{
  "threads": [
    {
      "tid": "string",
      "namespace": "string",
      "title": "string",
      "agentId": "string",
      "model": null,
      "context": {},
      "parentTaskId": "string",
      "state": null,
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "next": "string"
}
```

---

### `POST /threads`

Create thread.

Create a new kernl thread for interacting with AI assistants and managing conversations.

**Request Body**
```json
{
  "tid": "string",
  "agentId": "string",
  "title": "string",
  "context": {}
}
```

**Response**
```json
{
  "tid": "string",
  "namespace": "string",
  "title": "string",
  "agentId": "string",
  "model": {
    "provider": "string",
    "modelId": "string"
  },
  "context": {},
  "parentTaskId": "string",
  "state": "idle | running | stopped | error",
  "createdAt": "string",
  "updatedAt": "string"
}
```

---

### `GET /threads/{tid}`

Get thread.

Retrieve thread metadata.

**Path Parameters**
- `tid` — tid

**Response**
```json
{
  "tid": "string",
  "namespace": "string",
  "title": "string",
  "agentId": "string",
  "model": {
    "provider": "string",
    "modelId": "string"
  },
  "context": {},
  "parentTaskId": "string",
  "state": "idle | running | stopped | error",
  "createdAt": "string",
  "updatedAt": "string"
}
```

---

### `DELETE /threads/{tid}`

Delete thread.

Delete a thread and permanently remove all associated data, including messages and history.

**Path Parameters**
- `tid` — tid

**Response**
```json
{
  "success": true
}
```

---

### `PATCH /threads/{tid}`

Update thread.

Update properties of an existing thread, such as title or other metadata.

**Path Parameters**
- `tid` — tid

**Request Body**
```json
{
  "title": "string",
  "context": {}
}
```

**Response**
```json
{
  "tid": "string",
  "namespace": "string",
  "title": "string",
  "agentId": "string",
  "model": {
    "provider": "string",
    "modelId": "string"
  },
  "context": {},
  "parentTaskId": "string",
  "state": "idle | running | stopped | error",
  "createdAt": "string",
  "updatedAt": "string"
}
```

---

### `POST /threads/{tid}/abort`

Abort thread.

Abort an active thread and stop any ongoing AI processing or command execution.

**Path Parameters**
- `tid` — tid

**Response**
```json
{
  "success": true
}
```

---

### `GET /threads/{tid}/messages`

Get thread messages.

Retrieve messages for a thread as UIMessages.

**Path Parameters**
- `tid` — tid

**Response**
```json
{
  "messages": [
    {
      "id": "string",
      "role": "user | assistant",
      "parts": []
    }
  ]
}
```

---

### `POST /threads/{tid}/stream`

Stream thread execution.

Send a message to a thread and stream the agent response. The thread must exist and determines which agent handles the request.

**Path Parameters**
- `tid` — Thread ID

**Request Body**
```json
{
  "message": {
    "id": "string",
    "role": "user | assistant",
    "parts": [
      {}
    ]
  }
}
```

---

### `PATCH /threads/{tid}/messages/{messageID}/parts/{partID}`

Update message part.

Update a specific part of a message (e.g., add image, modify content).

**Path Parameters**
- `tid` — Thread ID
- `messageID` — Message ID
- `partID` — Part ID

**Request Body**
```json
{
  "content": null
}
```

**Response**
```json
{
  "success": true
}
```

---

### `DELETE /threads/{tid}/messages/{messageID}/parts/{partID}`

Delete message part.

Remove a part from a message.

**Path Parameters**
- `tid` — Thread ID
- `messageID` — Message ID
- `partID` — Part ID

**Response**
```json
{
  "success": true
}
```

---

## Tools

### `GET /tools`

List tools.

Get a list of available tools with their JSON schema parameters for a specific provider and model combination.

**Query Parameters**
- `agentId` (optional) — Filter by agent ID

**Response**
```json
{
  "tools": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "parameters": {}
    }
  ]
}
```

---

### `GET /tools/{toolID}`

Get tool.

Retrieve a specific tool by its ID, including its JSON schema parameters.

**Path Parameters**
- `toolID` — Tool ID

**Response**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "parameters": {}
}
```

---

## Toolkits

### `GET /toolkits`

List toolkits.

Get a list of all available toolkits (groups of tools).

**Response**
```json
{
  "toolkits": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "tools": [
        "string"
      ]
    }
  ]
}
```

---

### `GET /toolkits/{toolkitID}`

Get toolkit.

Retrieve a specific toolkit with its tools.

**Path Parameters**
- `toolkitID` — Toolkit ID

**Response**
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "tools": [
    "string"
  ]
}
```

---

## Realtime

### `POST /realtime/credential`

Get realtime credential.

Get ephemeral credentials for browser-side realtime connections.

**Request Body**
```json
{
  "provider": "openai | xai",
  "modelId": "string",
  "agentId": "string"
}
```

**Response**
```json
{
  "credential": {
    "kind": "token | url",
    "token": "string",
    "url": "string",
    "expiresAt": "string"
  }
}
```

---

## Providers

### `GET /providers`

List providers.

Get a list of all available AI providers, including both available and connected ones.

**Response**
```json
{
  "providers": [
    {
      "id": "string",
      "name": "string",
      "models": [
        "string"
      ],
      "auth": {
        "type": "api_key | oauth",
        "configured": true
      }
    }
  ]
}
```

---

### `POST /providers/{providerID}/oauth/authorize`

OAuth authorize.

Initiate OAuth authorization for a specific AI provider to get an authorization URL.

**Path Parameters**
- `providerID` — Provider ID

**Request Body**
```json
{
  "redirectUri": "string"
}
```

**Response**
```json
{
  "url": "string"
}
```

---

### `POST /providers/{providerID}/oauth/callback`

OAuth callback.

Handle the OAuth callback from a provider after user authorization.

**Path Parameters**
- `providerID` — Provider ID

**Request Body**
```json
{
  "code": "string",
  "state": "string"
}
```

**Response**
```json
{
  "success": true
}
```

---

## MCP

### `GET /mcps`

Get MCP status.

Get the status of all Model Context Protocol (MCP) servers.

**Response**
```json
{
  "servers": [
    {
      "name": "string",
      "status": "connected | disconnected | error",
      "tools": [
        "string"
      ],
      "resources": [
        "string"
      ]
    }
  ]
}
```

---

### `POST /mcps`

Add MCP server.

Dynamically add a new Model Context Protocol (MCP) server to the system.

**Request Body**
```json
{
  "name": "string",
  "transport": {
    "type": "stdio | http",
    "command": "string",
    "url": "string"
  }
}
```

**Response**
```json
{
  "name": "string",
  "status": "connected | disconnected | error",
  "tools": [
    "string"
  ],
  "resources": [
    "string"
  ]
}
```

---

### `POST /mcps/{name}/auth`

Start MCP OAuth.

Start OAuth authentication flow for a Model Context Protocol (MCP) server.

**Path Parameters**
- `name` — name

**Response**
```json
{
  "authorizationUrl": "string"
}
```

---

### `DELETE /mcps/{name}/auth`

Remove MCP OAuth.

Remove OAuth credentials for an MCP server

**Path Parameters**
- `name` — name

**Response**
```json
{
  "success": true
}
```

---

### `POST /mcps/{name}/auth/callback`

Complete MCP OAuth.

Complete OAuth authentication for a Model Context Protocol (MCP) server using the authorization code.

**Path Parameters**
- `name` — name

**Request Body**
```json
{
  "code": "string"
}
```

---

### `POST /mcps/{name}/auth/authenticate`

Authenticate MCP OAuth.

Start OAuth flow and wait for callback (opens browser)

**Path Parameters**
- `name` — name

---

### `POST /mcps/{name}/connect`

Connect an MCP server

**Path Parameters**
- `name` — name

**Response**
```json
{
  "success": true
}
```

---

### `POST /mcps/{name}/disconnect`

Disconnect an MCP server

**Path Parameters**
- `name` — name

**Response**
```json
{
  "success": true
}
```

---

### `DELETE /mcps/{name}`

Remove MCP server.

Remove an MCP server registration.

**Path Parameters**
- `name` — Server name

**Response**
```json
{
  "success": true
}
```

---

