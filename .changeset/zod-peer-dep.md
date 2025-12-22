---
"kernl": patch
"@kernl-sdk/shared": patch
---

Move zod to peerDependencies to prevent version conflicts

Consumers should add `zod` as a direct dependency in their project. This ensures
a single zod instance is used across all packages, avoiding type incompatibilities
that could cause TypeScript to hang during type checking.
