---
"@kernl-sdk/core": patch
---

Fix Kernl type exports - remove duplicate old Kernl definition from dist root that was missing the threads property. The correct Kernl class with ThreadsResource is now properly exported.
