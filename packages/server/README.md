# @kernl-sdk/server

> **Experimental** - This package is for internal development and is not published to npm.

Hono-based HTTP server for serving kernl agents via REST API.

## Endpoints

- `GET /health` - Health check
- `GET /agents` - List registered agents
- `POST /agents/:id/stream` - Stream agent execution
- `GET /threads` - List threads
- `GET /threads/:tid` - Get thread with history
- `DELETE /threads/:tid` - Delete thread
