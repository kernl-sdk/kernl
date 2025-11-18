# Jarvis :: Chief of Staff

A lightweight planning + coordination agent powered by Linear and GitHub.
Jarvis gives small teams instant clarity on what’s blocked, what’s shipping, and what needs attention.

## Features

- Pulls issues from Linear and summarizes priority, status, and blockers
- Pulls PRs from GitHub and surfaces what’s waiting for review
- Synthesizes a “state of the sprint” snapshot on demand
- Produces short, high-signal operational summaries

## Toolkits

- Linear [link to src]
- Github [link to src]
- Hyperspell [link to src]
- Parallel | native web_search [link to src]

A: Monorepo client + server

Default setup. Multiple consumers + independent scaling of web vs. server

```
jarvis/
  pnpm-workspace.yaml
  package.json
  .env.local

  server/                 # Hono + kernl
    src/
      api/v1/
      agents/
        jarvis.ts
      toolkits/
        linear/
          index.ts
        github/
          index.ts
      app.ts           # Hono HTTP server: /agents/:id/run, /stream
      index.ts
    tsconfig.json
    package.json

  web/                    # Next.js frontend (pure client → hits Hono)
    app/
      page.tsx            # Chat UI wired to /agents/jarvis/run
      layout.tsx
    components/
      chat.tsx
    lib/
      api.ts              # tiny client for POST /agents/:id/run
    next.config.mjs
    tsconfig.json
    package.json
```
