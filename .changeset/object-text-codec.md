---
"kernl": patch
---

Add ObjectTextCodec for YAML-based object projection in memory indexing

- Memory encoder now produces `objtext` field for FTS on structured objects
- Embedding input combines text + objtext for richer semantic search
- Fix domain codec to properly preserve user metadata (record.metadata)
