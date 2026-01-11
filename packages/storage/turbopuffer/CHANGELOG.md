# @kernl-sdk/turbopuffer

## 0.1.9

### Patch Changes

- Updated dependencies [830b52a]
  - @kernl-sdk/shared@0.4.0
  - @kernl-sdk/retrieval@0.1.8

## 0.1.8

### Patch Changes

- @kernl-sdk/retrieval@0.1.7

## 0.1.7

### Patch Changes

- @kernl-sdk/retrieval@0.1.6

## 0.1.6

### Patch Changes

- Updated dependencies [25e46e7]
  - @kernl-sdk/shared@0.3.1
  - @kernl-sdk/retrieval@0.1.5

## 0.1.5

### Patch Changes

- @kernl-sdk/retrieval@0.1.4

## 0.1.4

### Patch Changes

- Add PATCH codec export for document updates

## 0.1.3

### Patch Changes

- Updated dependencies [2b0993d]
  - @kernl-sdk/shared@0.3.0
  - @kernl-sdk/retrieval@0.1.3

## 0.1.2

### Patch Changes

- Bump to pick up @kernl-sdk/shared with pagination types
- Updated dependencies
  - @kernl-sdk/retrieval@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies
  - @kernl-sdk/shared@0.2.0
  - @kernl-sdk/retrieval@0.1.1

## 0.1.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [a7d6138]
  - @kernl-sdk/retrieval@0.1.0
