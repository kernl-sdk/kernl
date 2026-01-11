# Docster

Auto-update docs on code changes via PR.

## How it works

```
GitHub Action triggers (PR, push, manual)
           │
           ▼
┌─────────────────────────────────────────┐
│  Stage 1: Triager                       │
│                                         │
│  - Fetch commit diff via GitHub API     │
│  - Explore repo (README, docs folder)   │
│  - Sonnet 4.5 analyzes in context       │
│  - Returns { needs_updating, reason }   │
└─────────────────────────────────────────┘
           │
           ▼
      needs_updating?
      /            \
    No              Yes
     │               │
     ▼               ▼
  Exit early   ┌──────────────────────────┐
  (log reason) │  Stage 2: Docster        │
               │  (full sandbox)          │
               │                          │
               │  1. Clone repo           │
               │  2. Explore docs folder  │
               │  3. Update relevant docs │
               │  4. Create branch, commit│
               │  5. Push & open PR       │
               └──────────────────────────┘
```

This two-stage approach saves cost and time by skipping the full sandbox when no documentation updates are needed (most commits).

## Files

```
microprojects/docster/
├── action.yml              # GitHub Action definition
├── src/
│   ├── index.ts            # Entry: two-stage orchestration
│   ├── agents/
│   │   ├── triage.ts       # Stage 1: analyze diff, structured output
│   │   └── docster.ts      # Stage 2: update docs, create PR
│   └── toolkits/
│       ├── daytona/        # Sandbox fs/git/process tools
│       └── github/         # PR creation tools
├── package.json
├── tsconfig.json
└── README.md
```

## Usage

```yaml
# .github/workflows/docster.yml
name: Docster
on: [pull_request, push]

jobs:
  update-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: kernl-sdk/docster@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          daytona_api_key: ${{ secrets.DAYTONA_API_KEY }}
```

## Agents

### Triager (Stage 1)

```typescript
const TriageSchema = z.object({
  needs_updating: z.boolean(),
  reason: z.string(),
});

const triager = new Agent<RepoContext, typeof TriageSchema>({
  id: "triager",
  name: "Triager",
  model: anthropic("claude-sonnet-4-5"),
  output: TriageSchema,
  toolkits: [repoRead], // can explore README, docs folder via GitHub API
  instructions: `Analyze code diffs to determine if docs need updating...`,
});
```

### Docster (Stage 2)

```typescript
const docster = new Agent<DocsterContext>({
  id: "docster",
  name: "Docster",
  model: anthropic("claude-opus-4-5"),
  toolkits: [fs, git, process, pulls],
  instructions: `
    You update documentation based on code changes.
    1. Clone the repo
    2. Explore docs folder
    3. Update relevant docs
    4. Create branch, commit, push, open PR
  `,
});
```

## Safety

Docster includes a built-in safeguard that **blocks pushes to `main` and `master` branches**. The agent will always create a feature branch for its changes.

For additional protection, configure GitHub branch protection on your repo:

**Settings → Branches → Add rule** for `main`:

| Setting | Recommended |
|---------|-------------|
| Require a pull request before merging | Yes |
| Require approvals | 1+ |
| Dismiss stale approvals on new commits | Yes |
| Require status checks to pass | Yes |
| Do not allow bypassing | Yes |
| Allow force pushes | No |
| Allow deletions | No |

This provides two layers of protection:
1. **Docster** - refuses to push to protected branches
2. **GitHub** - rejects direct pushes even if code fails

## Development

```bash
pnpm install
pnpm build
```
