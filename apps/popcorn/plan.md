# File Search Implementation Plan

## Overview

Implement the `@` file search functionality in the popcorn TUI by porting the file indexing system from the original opencode repo.

## Current State

- **File search endpoint is stubbed** - `server0/src/api/find.ts` returns empty arrays
- **Directory context flows correctly** - SDK sends `x-opencode-directory` header
- **Ripgrep tooling exists** - `server0/src/toolkits/search/glob.ts` has working `rgFiles()` but no auto-download
- **Autocomplete works** - `tui/src/component/prompt/autocomplete.tsx:189` calls `sdk.client.find.files()` but gets empty results

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ TUI: User types "@foo" in prompt                                 │
│ autocomplete.tsx:189                                             │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ SDK: sdk.client.find.files({ query: "foo" })                     │
│ Adds header: x-opencode-directory: /path/to/project              │
│ sdk/src/v2/client.ts:21-27                                       │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ RPC: Worker receives fetch request                               │
│ worker.ts:24-44 → app.fetch(request)                             │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Middleware: Extract directory from header                        │
│ app.ts (new middleware)                                          │
│ cx.set("directory", "/path/to/project")                          │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Route: GET /find/file?query=foo                                  │
│ find.ts → File.search({ query, directory })                      │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ File Module: Check cache, run ripgrep if needed                  │
│ file/index.ts                                                    │
│                                                                  │
│  1. cache.get("/path/to/project") → miss                         │
│  2. Ripgrep.files({ cwd: directory })                            │
│  3. Parse output, build index (files + dirs)                     │
│  4. cache.set("/path/to/project", index)                         │
│  5. Fuzzy match "foo" against file list                          │
│  6. Return sorted results                                        │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ Response: ["src/foo.ts", "lib/foobar.ts", ...]                   │
│ → TUI displays autocomplete dropdown                             │
└──────────────────────────────────────────────────────────────────┘
```

## Implementation Tasks

### 1. Add `bin` path to Global

**File:** `shared/src/global.ts`

Add a `bin` directory path for storing downloaded binaries:

```typescript
export const Path = {
  // ... existing paths ...
  get bin() {
    return path.join(getDataDir(), "bin");
  },
};
```

### 2. Create Ripgrep Module

**File:** `server0/src/util/ripgrep.ts` (NEW)

Port from opencode with:

- Auto-download ripgrep binary for all platforms (darwin, linux, windows)
- Platform detection and appropriate binary selection
- Zip extraction for Windows (`@zip.js/zip.js`)
- Tar extraction for Unix (via `tar` command)
- `files()` async generator for listing files
- `search()` for content search (future use)

**Key functions:**

```typescript
export namespace Ripgrep {
  // Get or download ripgrep binary path
  export async function filepath(): Promise<string>

  // Stream files from a directory
  export async function* files(input: {
    cwd: string
    glob?: string[]
    hidden?: boolean
    follow?: boolean
    maxDepth?: number
  }): AsyncGenerator<string>

  // Search file contents (future)
  export async function search(input: {
    cwd: string
    pattern: string
    glob?: string[]
    limit?: number
  }): Promise<Match[]>
}
```

**Platform binaries:**

```typescript
const PLATFORM = {
  "arm64-darwin": { platform: "aarch64-apple-darwin", extension: "tar.gz" },
  "arm64-linux": { platform: "aarch64-unknown-linux-gnu", extension: "tar.gz" },
  "x64-darwin": { platform: "x86_64-apple-darwin", extension: "tar.gz" },
  "x64-linux": { platform: "x86_64-unknown-linux-musl", extension: "tar.gz" },
  "x64-win32": { platform: "x86_64-pc-windows-msvc", extension: "zip" },
};
```

### 3. Create File Module

**File:** `server0/src/file/index.ts` (NEW)

File indexing and search:

```typescript
export namespace File {
  // Types
  interface FileCache {
    files: string[];
    dirs: string[];
    timestamp: number;
  }

  interface SearchOptions {
    query: string;
    directory: string;
    limit?: number;
    dirs?: boolean;
    type?: "file" | "directory";
  }

  // Build index using Ripgrep
  async function buildIndex(
    directory: string,
  ): Promise<{ files: string[]; dirs: string[] }>;

  // Special case for home directory (limit depth)
  async function buildHomeIndex(
    directory: string,
  ): Promise<{ files: string[]; dirs: string[] }>;

  // Get cached index with background refresh
  async function getIndex(
    directory: string,
  ): Promise<{ files: string[]; dirs: string[] }>;

  // Invalidate cache
  export function invalidate(directory: string): void;

  // Search with fuzzy matching
  export async function search(options: SearchOptions): Promise<string[]>;
}
```

**Key features:**

- Per-directory caching with TTL (30 seconds)
- Background refresh (non-blocking)
- Extracts directories from file paths
- Hidden file handling (sort last unless query starts with `.`)
- Home directory special case (limit scan depth)
- Fuzzy search via `fuzzysort`

### 4. Add Directory Middleware

**File:** `server0/src/app.ts` (MODIFY)

Add middleware to extract directory from requests:

```typescript
type Variables = {
  kernl: Kernl;
  directory: string; // ADD
};

// Add after CORS middleware, before routes:
app.use("/*", async (cx, next) => {
  // Priority: query param > header > process.cwd()
  const directory =
    cx.req.query("directory") ||
    cx.req.header("x-opencode-directory") ||
    process.cwd();

  cx.set("directory", directory);
  await next();
});
```

### 5. Implement Find Endpoint

**File:** `server0/src/api/find.ts` (MODIFY)

Replace stub with actual implementation:

```typescript
import { Hono } from "hono";
import * as File from "@/file";

type Variables = {
  directory: string;
};

export const find = new Hono<{ Variables: Variables }>();

/**
 * GET /find/file
 *
 * Query params:
 * - query: string - fuzzy search query
 * - directory: string (optional) - override directory from header
 * - dirs: "true" | "false" - include directories
 * - type: "file" | "directory" - filter by type
 * - limit: number - max results (default 100)
 */
find.get("/file", async (cx) => {
  const query = cx.req.query("query") ?? "";
  const directory = cx.req.query("directory") || cx.get("directory");
  const dirs = cx.req.query("dirs") !== "false";
  const type = cx.req.query("type") as "file" | "directory" | undefined;
  const limit = parseInt(cx.req.query("limit") ?? "100", 10);

  const results = await File.search({
    query,
    directory,
    dirs,
    type,
    limit,
  });

  return cx.json(results);
});

// Stubs for future implementation
find.get("/text", async (cx) => cx.json([]));
find.get("/symbol", async (cx) => cx.json([]));
```

### 6. Update Project Endpoint

**File:** `server0/src/api/project.ts` (MODIFY)

Use directory from context instead of `process.cwd()`:

```typescript
type Variables = {
  directory: string;
};

export const project = new Hono<{ Variables: Variables }>();

project.get("/", (cx) => {
  const directory = cx.get("directory");
  return cx.json([
    {
      id: "default",
      worktree: directory, // Use context directory
      time: { created: Date.now(), updated: Date.now() },
    },
  ]);
});
```

### 7. Add Dependencies

**File:** `server0/package.json` (MODIFY)

```json
{
  "dependencies": {
    "fuzzysort": "^3.1.0",
    "@zip.js/zip.js": "^2.7.34"
  }
}
```

## File Structure After Changes

```
server0/src/
├── util/
│   └── ripgrep.ts      # NEW - Ripgrep with auto-download
├── file/
│   └── index.ts        # NEW - File indexing & search
├── api/
│   ├── find.ts         # MODIFY - Implement endpoints
│   └── project.ts      # MODIFY - Use directory context
├── app.ts              # MODIFY - Add directory middleware
└── ...

shared/src/
└── global.ts           # MODIFY - Add bin path
```

## Dependencies

| Package          | Version | Purpose                |
| ---------------- | ------- | ---------------------- |
| `fuzzysort`      | ^3.1.0  | Fuzzy string matching  |
| `@zip.js/zip.js` | ^2.7.34 | Windows zip extraction |

## Testing

1. Start popcorn in a project directory
2. Type `@` in the prompt
3. Verify autocomplete shows files from the project
4. Type a partial filename and verify fuzzy matching works
5. Verify directories are shown (with trailing `/`)
6. Verify hidden files are sorted last (unless query starts with `.`)

## Future Enhancements

- `/find/text` - Content search using `Ripgrep.search()`
- `/find/symbol` - Symbol search (requires LSP or tree-sitter)
- File watcher - Invalidate cache on file changes
- Frecency sorting - Track recently/frequently used files
