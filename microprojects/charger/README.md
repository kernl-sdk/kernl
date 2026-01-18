# Charger

A production-ready coding agent built with Kernl + Daytona.

**[Read the full guide →](https://docs.kernl.sh/guides/coding-agent)**

## What is this?

Charger is a complete example of a coding agent that can read, write, and execute code in a sandboxed environment. It demonstrates how to combine Kernl's agent framework with Daytona's secure sandboxes to build a real coding assistant.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│                    (React + AI SDK)                          │
│                           │                                  │
│                     streaming chat                           │
│                           ▼                                  │
├─────────────────────────────────────────────────────────────┤
│                         Backend                              │
│                    (Kernl Server)                            │
│                           │                                  │
│    ┌──────────────────────┼──────────────────────┐          │
│    │                      │                      │          │
│    ▼                      ▼                      ▼          │
│ ┌──────┐            ┌──────────┐           ┌─────────┐      │
│ │Agent │────────────│ Toolkits │───────────│ Storage │      │
│ └──────┘            └──────────┘           └─────────┘      │
│                           │                                  │
│                     Daytona SDK                              │
│                           ▼                                  │
├─────────────────────────────────────────────────────────────┤
│                    Daytona Sandbox                           │
│              (isolated Linux environment)                    │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
charger/
├── server/                        # Hono backend
│   ├── src/
│   │   ├── agents/
│   │   │   └── charger.ts         # The coding agent
│   │   ├── api/
│   │   │   ├── agents/            # POST /agents/:id/stream
│   │   │   └── threads/           # GET/DELETE /threads
│   │   ├── lib/
│   │   │   ├── env.ts             # Environment validation
│   │   │   ├── error.ts           # API error classes
│   │   │   └── logger.ts          # Pino logger
│   │   ├── toolkits/
│   │   │   ├── daytona/           # Sandbox tools (via registry)
│   │   │   └── parallel/          # Web search (via Parallel AI)
│   │   ├── app.ts                 # Hono app builder
│   │   └── index.ts               # Entry point
│   ├── package.json
│   └── .env.local
└── web/                           # Frontend (agentic-chatbot template)
```

The Daytona toolkit is installed from the Kernl registry:

```bash
kernl add toolkit daytona
```

This gives you file system, process, git, and code execution tools out of the box.

The Parallel toolkit provides web search via [Parallel AI](https://parallel.ai)'s MCP server.

## Quick Start

```bash
# Configure
cp server/.env.example server/.env.local
# Add your DAYTONA_API_KEY, ANTHROPIC_API_KEY, DATABASE_URL

cp web/.env.example web/.env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001

# Install and run
pnpm install
pnpm dev
```

This starts both the server (port 3001) and the frontend (port 3000).

## Key Concepts

- **Lazy sandbox provisioning** — Sandboxes are created on first tool use, not upfront
- **Context flow** — Sandbox ID persists in thread context across requests
- **Tool composition** — File system and process tools combine into a complete coding toolkit
