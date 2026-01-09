# @kernl/libsql

## 0.1.29

### Patch Changes

- @kernl-sdk/storage@0.1.29

## 0.1.28

### Patch Changes

- @kernl-sdk/storage@0.1.28

## 0.1.27

### Patch Changes

- @kernl-sdk/storage@0.1.27

## 0.1.26

### Patch Changes

- @kernl-sdk/storage@0.1.26

## 0.1.25

### Patch Changes

- Updated dependencies [25e46e7]
  - @kernl-sdk/storage@0.1.25

## 0.1.24

### Patch Changes

- @kernl-sdk/storage@0.1.24

## 0.1.23

### Patch Changes

- @kernl-sdk/storage@0.1.23

## 0.1.22

### Patch Changes

- @kernl-sdk/storage@0.1.22

## 0.1.21

### Patch Changes

- @kernl-sdk/storage@0.1.21

## 0.1.20

### Patch Changes

- @kernl-sdk/storage@0.1.20

## 0.1.19

### Patch Changes

- @kernl-sdk/storage@0.1.19

## 0.1.18

### Patch Changes

- @kernl-sdk/storage@0.1.18

## 0.1.17

### Patch Changes

- @kernl-sdk/storage@0.1.17

## 0.1.16

### Patch Changes

- @kernl-sdk/storage@0.1.16

## 0.1.15

### Patch Changes

- Updated dependencies
  - @kernl-sdk/storage@0.1.15

## 0.1.14

### Patch Changes

- @kernl-sdk/storage@0.1.14

## 0.1.13

### Patch Changes

- @kernl-sdk/storage@0.1.13

## 0.1.12

### Patch Changes

- @kernl-sdk/storage@0.1.12

## 0.1.11

### Patch Changes

- @kernl-sdk/storage@0.1.11

## 0.1.10

### Patch Changes

- Fix ESM compatibility by adding --resolve-full-paths to tsc-alias build
- Updated dependencies
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
  - @kernl-sdk/storage@0.1.9

## 0.1.8

### Patch Changes

- @kernl-sdk/storage@0.1.8

## 0.1.7

### Patch Changes

- Updated dependencies [ad56b86]
  - @kernl-sdk/storage@0.1.7

## 0.1.6

### Patch Changes

- @kernl-sdk/storage@0.1.6

## 0.1.5

### Patch Changes

- Updated dependencies [8e3bac1]
  - @kernl-sdk/storage@0.1.5

## 0.1.4

### Patch Changes

- @kernl-sdk/storage@0.1.4

## 0.1.3

### Patch Changes

- @kernl-sdk/storage@0.1.3

## 0.1.2

### Patch Changes

- @kernl-sdk/storage@0.1.2

## 0.1.1

### Patch Changes

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
  - @kernl/storage@0.1.0
