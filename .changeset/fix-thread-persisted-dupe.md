---
"@kernl-sdk/core": patch
"@kernl-sdk/pg": patch
---

Fix duplicate thread inserts when streaming from hydrated threads by making
storage-backed Thread instances explicitly marked as persisted, and ensure
Postgres integration tests cover the no-double-insert behavior.


