# Jarvis :: Chief of Staff

A lightweight planning and coordination agent built on kernl that helps small teams see what’s blocked, what’s shipping, and what needs attention.

## What you get

- **Agent server**: An HTTP API that runs Jarvis and exposes endpoints for agents and threads.
- **Tooling integrations**: Example toolkits for Linear, GitHub, and more.
- **Web UI**: A simple chat-style interface wired to the Jarvis agent.
- **Reference implementation**: A concrete example of how to build and wire an agent system on top of kernl.

## Quick start

This assumes you’ve cloned the main `kernl` repo and have `pnpm` installed.

### 1. Clone and install

```bash
git clone <your-fork-or-origin> kernl
cd kernl
pnpm install
```

### 2. Set up environment

Jarvis lives under `microprojects/jarvis` and is split into a server and a Next.js app.

1. Copy the example env files (if present) to local overrides:

   ```bash
   cd microprojects/jarvis
   cp server/.env.example server/.env.local    # adjust names if different
   cp nextjs/.env.example nextjs/.env.local    # optional, if a web app exists
   ```

2. Fill in required values, such as:

   - API keys for providers (e.g. OpenAI)
   - Credentials for Linear / GitHub, if you want those toolkits active
   - Database URL if the server uses a persistent store

Check the comments in the example env files for the minimal values needed to get Jarvis running.

### 3. Start the server (and web app)

In one terminal:

```bash
cd microprojects/jarvis/server
pnpm dev
```

In another terminal (if the web app is present):

```bash
cd microprojects/jarvis/nextjs
pnpm dev
```

By default, you’ll typically see:

- API server on `http://localhost:3001` (or similar)
- Web UI on `http://localhost:3000`

Check the respective `package.json` files for exact ports and scripts.

### 4. Try it

- Open the web UI in your browser and start a conversation with Jarvis.
- Or hit the API directly, for example:

  ```bash
  curl -X POST "http://localhost:3001/v1/threads" \
    -H "Content-Type: application/json" \
    -d '{
      "agent_id": "jarvis",
      "input": "What is blocked this sprint?"
    }'
  ```

Adjust the URL and payload to match the current server routes.

## Project layout

At a high level:

```text
microprojects/jarvis/
  server/       # Hono / kernl server, agents, toolkits, API routes
  nextjs/       # Optional Next.js frontend for chatting with Jarvis
```

Key places to look:

- **Agents**: `server/src/agents` – where Jarvis and other agents live.
- **Toolkits**: `server/src/toolkits` – integrations like Linear and GitHub.
- **API routes**: `server/src/_api` – HTTP endpoints exposed by the server.

## Development

From `microprojects/jarvis`:

- **Run the server**:

  ```bash
  cd server
  pnpm dev
  ```

- **Run the web app**:

  ```bash
  cd nextjs
  pnpm dev
  ```

See each subproject’s `package.json` for additional scripts (tests, linting, etc.).


