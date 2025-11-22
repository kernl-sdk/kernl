# @kernl/pg

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
