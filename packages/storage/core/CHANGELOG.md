# @kernl/storage

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
