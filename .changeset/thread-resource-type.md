---
"@kernl-sdk/core": patch
"@kernl-sdk/storage": patch
"@kernl-sdk/pg": patch
---

Add ThreadResource public API type that separates the public thread interface from internal Thread execution primitive. ThreadsResource methods now return ThreadResource with serialized data instead of Thread class instances. Add createdAt/updatedAt timestamps to threads.
