# Atlas :: Librarian / documentation

A plug-and-play docs Q&A agent that integrates with your Mintlify docs (or any static docs) for instant, accurate answers.

## Features

- Answers product + API questions using your docs
- Retrieves relevant sections via Mintlify search
- Produces grounded answers with doc-linked citations
- Zero indexing pipeline required

## Toolkits

- Mintlify [link to src]
- Turbopuffer [link to src]

## Project structure

- Hono server that powers the kernl, Next owns the project -> one-command deploy to Vercel

B: Next.js with Hono inside

```
atlas/
  app/
    api/
      agents/
        [[...route]]/
          route.ts        # Hono router → /api/agents/:id/run, /stream
    page.tsx              # Chat UI
    layout.tsx
  agents/
    jarvis.ts             # Kernl agent
  toolkits/
    linear/
      index.ts
    github/
      index.ts
  kernl.ts              # new Kernl(), register(jarvis)
  package.json
  tsconfig.json
  .env.local
```
