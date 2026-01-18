# kernl :: Agentic chatbot

A minimal Next.js chat app wired to a backend agent, built with the Vercel AI SDK and its **AI Elements** component library.

## Tech stack

- **Framework**: Next.js 16 (App Router, TypeScript, React 19)
- **AI**: Vercel AI SDK (`ai`, `@ai-sdk/react`) + **AI Elements** UI components
- **UI**: Tailwind CSS, Radix UI primitives, and local UI components in `src/components/ui`
- **Data fetching**: SWR for client-side caching and infinite scroll
- **Backend**: Kernl API for thread and agent management

## Project structure

```text
src/
  app/
    page.tsx
    chat/
    api/chat/
  components/
    ai-elements/
    chat/
    ui/
  lib/
  hooks/
```

## Getting started

- **Install dependencies**

```bash
pnpm install
```

- **Run the dev server**

```bash
pnpm dev
```

- Open `http://localhost:3000` in your browser.

- (Optional) Configure the backend base URL in `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080   # default if unset
```

## Server API

This chatbot expects a backend server implementing the kernl Server API. See [`openapi.json`](./openapi.json) for the full OpenAPI spec.

Key endpoints used:

- `GET /v1/agents` - List available agents
- `GET /v1/agents/:id` - Get agent details
- `POST /v1/agents/:id/stream` - Stream chat messages
- `GET /v1/threads` - List conversation threads
- `GET /v1/threads/:id` - Get thread with history

## Docs

- **kernl**: [TODO]
- **Vercel AI SDK**: https://ai-sdk.dev/docs/introduction
- **AI Elements**: https://ai-sdk.dev/elements
