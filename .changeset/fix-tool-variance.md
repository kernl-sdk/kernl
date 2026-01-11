---
"kernl": patch
---

Fix type variance for toolkit composition

- Use `any` instead of generic context types in stored agent references to break invariance
- Allows toolkits with different context types to be composed in the same agent
- Remove unused agent parameter from isEnabled signature
