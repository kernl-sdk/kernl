# arXiv Scout

Daily arXiv paper scanner that surfaces AI research relevant to agent runtimes.

## How it works

```
┌─────────────────────────────────────────────────────────────────┐
│  Cron: Daily @ 6AM UTC                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 0: Fetch                                                 │
│                                                                 │
│  Query arXiv API for papers from last 24h:                      │
│  cs.AI, cs.LG, cs.CL, cs.MA, cs.SE                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Stage 1: Harvester (Sonnet)                                    │
│                                                                 │
│  - Read title + abstract for each paper                         │
│  - Score relevance to kernl (0.0 - 1.0)                         │
│  - Filter to papers scoring >= 0.7                              │
│  - Tag with relevant topic                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                      relevant papers?
                      /            \
                    No              Yes (top 5)
                     │               │
                     ▼               ▼
              Write empty    ┌──────────────────────────┐
              digest         │  Stage 2: Analyst        │
                             │  (Sonnet)                │
                             │                          │
                             │  For each paper:         │
                             │  - Summarize findings    │
                             │  - Extract key insights  │
                             │  - Map to kernl concepts │
                             └──────────────────────────┘
                                          │
                                          ▼
                              ┌──────────────────────────┐
                              │  Write to research/      │
                              │  YYYY-MM-DD.md           │
                              └──────────────────────────┘
```

## Relevance Criteria

Papers are filtered for relevance to agent runtime development:

| Topic | Description |
|-------|-------------|
| Agent Architectures | Reasoning loops, tool calling, structured output |
| Memory Systems | Long-term memory, RAG, episodic memory |
| Multi-Agent Coordination | Delegation, handoffs, orchestration |
| Tool Use & Protocols | Function calling, MCP, sandboxing |
| Observability | Tracing, debugging, interpretability |
| Realtime & Streaming | Voice, audio, low-latency interactions |
| Persistence & State | Threads, sessions, checkpointing |

## Files

```
microprojects/arxiv-scout/
├── action.yml              # GitHub Action definition
├── src/
│   ├── index.ts            # Entry point
│   ├── agents/
│   │   ├── harvest.ts      # Stage 1: filter papers
│   │   └── analyst.ts      # Stage 2: deep analysis
│   ├── lib/
│   │   ├── arxiv.ts        # arXiv API client
│   │   └── criteria.ts     # Relevance criteria
│   └── output/
│       └── writer.ts       # Markdown writer
├── research/               # Output: daily digests
│   └── YYYY-MM-DD.md
├── package.json
├── tsconfig.json
└── README.md
```

## Usage

### As a GitHub Action

```yaml
# .github/workflows/arxiv-scout.yml
name: arXiv Scout

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6AM UTC
  workflow_dispatch:      # Manual trigger

jobs:
  scout:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: kernl-sdk/arxiv-scout@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Commit results
        run: |
          git config user.name "arXiv Scout"
          git config user.email "scout@kernl.sh"
          git add microprojects/arxiv-scout/research/
          git diff --staged --quiet || git commit -m "research: arxiv scout $(date +%Y-%m-%d)"
          git push
```

### Local Development

```bash
# Install dependencies
pnpm install

# Run locally
ANTHROPIC_API_KEY=sk-... pnpm dev

# Build for distribution
pnpm build
```

## Output Format

Each daily digest is written to `research/YYYY-MM-DD.md`:

```markdown
# arXiv Scout: 2025-01-21

Scanned **142** papers from cs.AI, cs.LG, cs.CL, cs.MA, cs.SE.
Found **3** relevant to kernl.

---

### Hierarchical Memory Networks for Long-Horizon Agent Tasks

**arXiv:** [2501.12345](https://arxiv.org/abs/2501.12345)
**Authors:** Smith et al.
**Relevance:** Memory Systems (score: 0.85)
**Tags:** `memory` `long-term` `agents`

> Proposes a three-tier memory architecture...

#### Summary
...

#### Key Findings
- Finding 1
- Finding 2

#### Implications for kernl
...

---
```

## Cost

Approximate daily cost:
- Harvester (Sonnet): ~$0.05-0.10 for 100-200 papers
- Analyst (Sonnet): ~$0.02-0.05 per paper analyzed
- Total: ~$0.10-0.30/day depending on volume

## arXiv API

This project includes a Stainless-style arXiv API client:

```typescript
import { arxiv } from "./lib/arxiv";

// List recent papers
const papers = await arxiv.papers.list({
  categories: ["cs.AI", "cs.LG"],
  daysBack: 1,
  maxResults: 100,
});

// Get a specific paper
const paper = await arxiv.papers.get("2501.12345");
```
