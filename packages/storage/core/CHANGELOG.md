# @kernl/storage

## 0.2.7

### Patch Changes

- Updated dependencies [772acad]
  - kernl@0.12.7

## 0.2.6

### Patch Changes

- Updated dependencies [adc9cf2]
  - kernl@0.12.6

## 0.2.5

### Patch Changes

- Updated dependencies [7fc129b]
  - kernl@0.12.5

## 0.2.4

### Patch Changes

- Updated dependencies [296c377]
  - kernl@0.12.4

## 0.2.3

### Patch Changes

- Updated dependencies [884e513]
- Updated dependencies [0576a77]
  - @kernl-sdk/protocol@0.5.1
  - kernl@0.12.3

## 0.2.2

### Patch Changes

- Updated dependencies [11cf6fd]
  - kernl@0.12.2

## 0.2.1

### Patch Changes

- Updated dependencies [58e9db2]
- Updated dependencies [320b76a]
  - kernl@0.12.1

## 0.2.0

### Minor Changes

- 8815744: **BREAKING:** Refactor event kind naming from kebab-case to dot notation

  This aligns the language model stream/item kinds with the existing realtime events naming convention.

  ### Kind value changes

  | Old                | New                |
  | ------------------ | ------------------ |
  | `tool-call`        | `tool.call`        |
  | `tool-result`      | `tool.result`      |
  | `text-start`       | `text.start`       |
  | `text-delta`       | `text.delta`       |
  | `text-end`         | `text.end`         |
  | `reasoning-start`  | `reasoning.start`  |
  | `reasoning-delta`  | `reasoning.delta`  |
  | `reasoning-end`    | `reasoning.end`    |
  | `tool-input-start` | `tool.input.start` |
  | `tool-input-delta` | `tool.input.delta` |
  | `tool-input-end`   | `tool.input.end`   |
  | `stream-start`     | `stream.start`     |

  ### ToolInputStartEvent: `toolName` → `toolId`

  The `ToolInputStartEvent` now uses `toolId` to match `ToolCall` and `ToolResult`.

  ### Migration

  If you have persisted thread events, run:

  ```sql
  UPDATE thread_events SET kind = 'tool.call' WHERE kind = 'tool-call';
  UPDATE thread_events SET kind = 'tool.result' WHERE kind = 'tool-result';
  ```

### Patch Changes

- Updated dependencies [8815744]
  - @kernl-sdk/protocol@0.5.0
  - kernl@0.12.0

## 0.1.31

### Patch Changes

- Updated dependencies [830b52a]
  - @kernl-sdk/shared@0.4.0
  - kernl@0.11.4
  - @kernl-sdk/protocol@0.4.2

## 0.1.30

### Patch Changes

- Updated dependencies [97c66df]
  - kernl@0.11.3

## 0.1.29

### Patch Changes

- Updated dependencies [47e44c0]
  - kernl@0.11.2

## 0.1.28

### Patch Changes

- Updated dependencies [e1a7848]
  - kernl@0.11.1

## 0.1.27

### Patch Changes

- Updated dependencies [bb6ac60]
  - kernl@0.11.0
  - @kernl-sdk/protocol@0.4.1

## 0.1.26

### Patch Changes

- Updated dependencies [f593374]
  - kernl@0.10.0
  - @kernl-sdk/protocol@0.4.0

## 0.1.25

### Patch Changes

- 25e46e7: Move zod to peerDependencies to prevent version conflicts

  Consumers should add `zod` as a direct dependency in their project. This ensures
  a single zod instance is used across all packages, avoiding type incompatibilities
  that could cause TypeScript to hang during type checking.

- Updated dependencies [25e46e7]
  - kernl@0.9.1
  - @kernl-sdk/shared@0.3.1
  - @kernl-sdk/protocol@0.3.1

## 0.1.24

### Patch Changes

- Updated dependencies [572ae80]
  - @kernl-sdk/protocol@0.3.0
  - kernl@0.9.0

## 0.1.23

### Patch Changes

- Updated dependencies [e90b227]
  - kernl@0.8.4

## 0.1.22

### Patch Changes

- Updated dependencies [ae11e54]
  - kernl@0.8.3

## 0.1.21

### Patch Changes

- Updated dependencies
  - kernl@0.8.2

## 0.1.20

### Patch Changes

- Updated dependencies [86fad68]
  - kernl@0.8.1

## 0.1.19

### Patch Changes

- Updated dependencies [3fe8682]
  - kernl@0.8.0

## 0.1.18

### Patch Changes

- Updated dependencies [6a6aa03]
  - kernl@0.7.4

## 0.1.17

### Patch Changes

- Updated dependencies
  - kernl@0.7.4

## 0.1.16

### Patch Changes

- Updated dependencies [2b0993d]
  - @kernl-sdk/shared@0.3.0
  - kernl@0.7.3
  - @kernl-sdk/protocol@0.2.8

## 0.1.15

### Patch Changes

- Bump to pick up @kernl-sdk/shared with pagination types
- Updated dependencies
  - kernl@0.7.2
  - @kernl-sdk/protocol@0.2.7

## 0.1.14

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.2.0
  - kernl@0.7.1
  - @kernl-sdk/protocol@0.2.6

## 0.1.13

### Patch Changes

- Updated dependencies [13545a5]
  - kernl@0.7.0

## 0.1.12

### Patch Changes

- Updated dependencies [a7d6138]
  - kernl@0.6.3

## 0.1.11

### Patch Changes

- Updated dependencies [c5a5fcf]
  - kernl@0.6.2

## 0.1.10

### Patch Changes

- Fix ESM compatibility by adding --resolve-full-paths to tsc-alias build
- Updated dependencies
  - kernl@0.6.1
  - @kernl-sdk/shared@0.1.6
  - @kernl-sdk/protocol@0.2.5

## 0.1.9

### Patch Changes

- Migrate packages from GitHub Packages to npm registry.

  **Breaking change for `kernl` (formerly `@kernl-sdk/core`):**

  The core package has been renamed from `@kernl-sdk/core` to `kernl`. Update your imports:

  ```diff
  - import { Agent, Kernl } from "@kernl-sdk/core";
  + import { Agent, Kernl } from "kernl";
  ```

  All other packages remain under the `@kernl-sdk` scope and are now publicly available on npm.

- Updated dependencies
  - kernl@0.6.0
  - @kernl-sdk/shared@0.1.5
  - @kernl-sdk/protocol@0.2.4

## 0.1.8

### Patch Changes

- Updated dependencies [08ab8a0]
  - @kernl-sdk/core@0.5.1

## 0.1.7

### Patch Changes

- ad56b86: Introduce the public Kernl threads API surface (`kernl.threads` and
  `agent.threads`) for listing, getting, deleting, and reading history, backed
  by simple `Thread` and `ThreadEvent` models.

  Add explicit thread creation and update APIs, including first-class `title`
  support (stored in `metadata.title`) and structured `context` / `metadata`
  patch semantics, and tighten thread persistence behavior in core + storage
  implementations to keep context and metadata consistent across in-memory and
  Postgres stores.

- Updated dependencies [ad56b86]
  - @kernl-sdk/core@0.5.0

## 0.1.6

### Patch Changes

- Updated dependencies
  - @kernl-sdk/core@0.4.6

## 0.1.5

### Patch Changes

- 8e3bac1: Add ThreadResource public API type that separates the public thread interface from internal Thread execution primitive. ThreadsResource methods now return ThreadResource with serialized data instead of Thread class instances. Add createdAt/updatedAt timestamps to threads.
- Updated dependencies [8e3bac1]
  - @kernl-sdk/core@0.4.5

## 0.1.4

### Patch Changes

- Updated dependencies [ba8119d]
  - @kernl-sdk/core@0.4.4

## 0.1.3

### Patch Changes

- Updated dependencies [f536b15]
  - @kernl-sdk/core@0.4.3

## 0.1.2

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.1.4
  - @kernl-sdk/protocol@0.2.3
  - @kernl-sdk/core@0.4.2

## 0.1.1

### Patch Changes

- Updated dependencies
  - @kernl-sdk/core@0.4.1

## 0.1.0

### Minor Changes

- feat: add storage infrastructure with automatic initialization

  Adds comprehensive storage infrastructure to Kernl:
  - New `KernlStorage` and `ThreadStore` interfaces for persistent thread management
  - Automatic lazy initialization of storage on first agent execution
  - Thread checkpointing at key lifecycle points (start, post-tools, terminal-tick, stop)
  - Thread resumption support - pass `{ threadId }` to agent.run() or agent.stream()
  - In-memory storage implementation as default (no setup required)
  - PostgreSQL storage adapter via `@kernl/pg`
  - LibSQL storage adapter via `@kernl/libsql`
  - Full support for thread history queries and event filtering

### Patch Changes

- Updated dependencies
  - @kernl-sdk/core@0.5.0
