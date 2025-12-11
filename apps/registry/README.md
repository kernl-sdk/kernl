# kernl :: Registry

Toolkit registry for `kernl add toolkit <name>`.

## Contributing a Toolkit

### 1. Add dependencies

Install the toolkit's dependencies in this package (for IDE support):

```bash
cd apps/registry
pnpm add -D @googleapis/gmail
```

### 2. Write the toolkit

Create your toolkit in `toolkits/<name>/`:

```
toolkits/
└── gmail/
    ├── index.ts    # Toolkit export
    ├── send.ts     # Tool implementations
    └── read.ts
```

### 3. Register the toolkit

Add an entry to `registry/toolkits.ts`:

```typescript
{
  name: "gmail",
  type: "registry:toolkit",
  title: "Gmail Toolkit",
  description: "Send, read, and manage Gmail messages",
  dependencies: ["@googleapis/gmail@^5.0.0"],
  env: ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET"],
  files: [
    { path: "toolkits/gmail/index.ts" },
    { path: "toolkits/gmail/send.ts" },
    { path: "toolkits/gmail/read.ts" },
  ],
}
```

### 4. Build and test

```bash
pnpm build
```

Output goes to `dist/toolkits/<name>.json`.

## How It Works

- `package.json` has ALL deps for every toolkit (dev experience)
- Each toolkit declares only ITS OWN deps in `registry/toolkits.ts`
- Users only install what they need when running `kernl add toolkit`
