---
"kernl": minor
---

Add pipe processors and memory.load hook

- **Pipe processors**: New `Pipe` class for composable pre/post processing pipelines. Use `pipe.filter()`, `pipe.truncate()`, `pipe.guardrail()`, etc. to transform thread items before/after model requests.
- **memory.load hook**: New agent config option to inject working memory before each model request. Returns a string that gets wrapped in `<working_memory>` tags.
- **Error consolidation**: `GuardrailError` now exported from main entry. Removed separate `guardrail.ts` module.
