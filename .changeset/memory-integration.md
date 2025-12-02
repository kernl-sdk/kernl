---
"@kernl-sdk/retrieval": minor
"@kernl-sdk/pg": patch
"@kernl-sdk/turbopuffer": minor
"kernl": patch
---

Add agent.memories API and memory integration with vector backends

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
