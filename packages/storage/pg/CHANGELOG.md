# @kernl/pg

## 0.1.26

### Patch Changes

- Updated dependencies [f593374]
  - kernl@0.10.0
  - @kernl-sdk/storage@0.1.26
  - @kernl-sdk/retrieval@0.1.6

## 0.1.25

### Patch Changes

- Updated dependencies [25e46e7]
  - kernl@0.9.1
  - @kernl-sdk/shared@0.3.1
  - @kernl-sdk/storage@0.1.25
  - @kernl-sdk/retrieval@0.1.5

## 0.1.24

### Patch Changes

- Updated dependencies [572ae80]
  - kernl@0.9.0
  - @kernl-sdk/retrieval@0.1.4
  - @kernl-sdk/storage@0.1.24

## 0.1.23

### Patch Changes

- Updated dependencies [e90b227]
  - kernl@0.8.4
  - @kernl-sdk/storage@0.1.23

## 0.1.22

### Patch Changes

- Updated dependencies [ae11e54]
  - kernl@0.8.3
  - @kernl-sdk/storage@0.1.22

## 0.1.21

### Patch Changes

- Updated dependencies
  - kernl@0.8.2
  - @kernl-sdk/storage@0.1.21

## 0.1.20

### Patch Changes

- Updated dependencies [86fad68]
  - kernl@0.8.1
  - @kernl-sdk/storage@0.1.20

## 0.1.19

### Patch Changes

- Updated dependencies [3fe8682]
  - kernl@0.8.0
  - @kernl-sdk/storage@0.1.19

## 0.1.18

### Patch Changes

- Updated dependencies [6a6aa03]
  - kernl@0.7.4
  - @kernl-sdk/storage@0.1.18

## 0.1.17

### Patch Changes

- Updated dependencies
  - kernl@0.7.4
  - @kernl-sdk/storage@0.1.17

## 0.1.16

### Patch Changes

- Updated dependencies [2b0993d]
  - @kernl-sdk/shared@0.3.0
  - kernl@0.7.3
  - @kernl-sdk/retrieval@0.1.3
  - @kernl-sdk/storage@0.1.16

## 0.1.15

### Patch Changes

- Bump to pick up @kernl-sdk/shared with pagination types
- Updated dependencies
  - kernl@0.7.2
  - @kernl-sdk/retrieval@0.1.2
  - @kernl-sdk/storage@0.1.15

## 0.1.14

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.2.0
  - kernl@0.7.1
  - @kernl-sdk/retrieval@0.1.1
  - @kernl-sdk/storage@0.1.14

## 0.1.13

### Patch Changes

- Updated dependencies [13545a5]
  - kernl@0.7.0
  - @kernl-sdk/storage@0.1.13

## 0.1.12

### Patch Changes

- a7d6138: Add agent.memories API and memory integration with vector backends

  **@kernl-sdk/retrieval**
  - Add `planQuery()` for adapting queries based on backend capabilities
  - Add `SearchCapabilities` interface to describe backend features
  - Gracefully degrade hybrid queries when not supported

  **@kernl-sdk/pg**
  - Add `capabilities()` method to PGVectorSearchIndex
  - Fix hit decoding to include id in document

  **@kernl-sdk/turbopuffer**
  - Add `capabilities()` method describing supported search modes
  - Add bigint type mapping for timestamps
  - Fix hit decoding to include id in document
  - Add memory integration tests

  **kernl**
  - Add `agent.memories.create()` with simplified syntax (auto-generated IDs, flattened scope)
  - Add `agent.memories.search()` scoped to agent
  - Add backend-aware codecs for Turbopuffer field mapping (tvec → vector)
  - Default `include: true` for Turbopuffer queries to return all attributes

- Updated dependencies [a7d6138]
  - @kernl-sdk/retrieval@0.1.0
  - kernl@0.6.3
  - @kernl-sdk/storage@0.1.12

## 0.1.11

### Patch Changes

- c5a5fcf: Storage now auto-initializes on first operation - no need to call init() manually
- Updated dependencies [c5a5fcf]
  - kernl@0.6.2
  - @kernl-sdk/storage@0.1.11

## 0.1.10

### Patch Changes

- Fix ESM compatibility by adding --resolve-full-paths to tsc-alias build
- Updated dependencies
  - kernl@0.6.1
  - @kernl-sdk/shared@0.1.6
  - @kernl-sdk/storage@0.1.10

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
  - @kernl-sdk/storage@0.1.9

## 0.1.8

### Patch Changes

- 08ab8a0: Fix duplicate thread inserts when streaming from hydrated threads by making
  storage-backed Thread instances explicitly marked as persisted, and ensure
  Postgres integration tests cover the no-double-insert behavior.
- Updated dependencies [08ab8a0]
  - @kernl-sdk/core@0.5.1
  - @kernl-sdk/storage@0.1.8

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
  - @kernl-sdk/storage@0.1.7

## 0.1.6

### Patch Changes

- Updated dependencies
  - @kernl-sdk/core@0.4.6
  - @kernl-sdk/storage@0.1.6

## 0.1.5

### Patch Changes

- 8e3bac1: Add ThreadResource public API type that separates the public thread interface from internal Thread execution primitive. ThreadsResource methods now return ThreadResource with serialized data instead of Thread class instances. Add createdAt/updatedAt timestamps to threads.
- Updated dependencies [8e3bac1]
  - @kernl-sdk/core@0.4.5
  - @kernl-sdk/storage@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies [ba8119d]
  - @kernl-sdk/core@0.4.4
  - @kernl-sdk/storage@0.1.4

## 0.1.3

### Patch Changes

- Updated dependencies [f536b15]
  - @kernl-sdk/core@0.4.3
  - @kernl-sdk/storage@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.1.4
  - @kernl-sdk/storage@0.1.2
  - @kernl-sdk/core@0.4.2

## 0.1.1

### Patch Changes

- Updated dependencies
  - @kernl-sdk/core@0.4.1
  - @kernl-sdk/storage@0.1.1

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
  - @kernl/storage@0.1.0
