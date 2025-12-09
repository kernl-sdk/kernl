# microprojects :: Watson

A thinking partner for founders running customer-discovery loops—-turning raw call transcripts into evolving hypotheses, defensible insights, and visible patterns.

## Features

1. **Transcript ingestion + structuring**

- Auto-pull transcripts + metadata from notetaker
- Generate structured artifacts:
  - Summary
  - JTBD breakdown
  - Pain points
  - Objections
  - Desired outcomes
  - Feature mentions
  - Evidence flags (supports/contradicts hypotheses)
  - Store both structured data and transcript embeddings for fast retrieval.

2. **Persistent work context - product, strategy, brand, memories**

Watson should be aware of the current challenges + goals for the user / organization.

- Editable, versioned store containing:
  - Product overview
  - Target segments
  - Active hypotheses
  - Current research questions
- Agents can reason against this context ("supports H2", "contradicts pricing assumption", etc.).

## Notetaker support

- [Fireflies](https://fireflies.ai/)
- [Granola](https://www.granola.ai/)

## Quick Start

1. **Install dependencies**

```bash
pnpm install
```

2. **Configure environment**

```bash
cp .env.example .env.local
```
```
DATABASE_URL=postgres://...
WORKFLOW_POSTGRES_URL=postgres://...
TURBOPUFFER_API_KEY=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
```

3. **Set up workflow tables**

See more about how to use Vercel's workflow library here:

- [Foundations](https://useworkflow.dev/docs/foundations)
- [Postgres World](https://useworkflow.dev/docs/deploying/world/postgres-world)

```bash
pnpm exec workflow-postgres-setup
```

4. **Run**

```bash
pnpm dev
```

## Project structure

```
src/
├── agents/
│   └── watson.ts
├── api/
│   └── webhooks/fireflies.ts
├── lib/
├── workflows/
│   └── process-transcript/
│       ├── index.ts       # 'use workflow'
│       ├── 01-fetch.ts    # 'use step'
│       ├── 02-extract.ts  # 'use step'
│       └── 03-store.ts    # 'use step'
├── app.ts
└── index.ts
```

## Ingestion workflow

```
[Source: Fireflies/Otter/etc.]
              │ webhook
              ▼
      ┌───────────────────┐
      │ Ingestion Worker  │
      └─────────┬─────────┘
                │
                │ 1) Normalize
                │   - Conversation (messages, summary, metadata)
                │   - Persons, Orgs
                ▼
        ┌───────────────────┐
        │    Database       │
        └─────────┬─────────┘
          2) chunk│ transcript -- create memories
                  ▼
         ┌─────────────────────┐
         │  Chunker + Embedder │
         └─────────┬───────────┘
                   │
            3) create memories
```
