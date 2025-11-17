---
"@kernl-sdk/core": patch
---

fix: handle model stream errors gracefully

Thread.stream() now properly catches and converts model errors (like missing API keys) to error events, preventing the UI from hanging. Errors are logged via logger.error() and sent to clients as error chunks.
