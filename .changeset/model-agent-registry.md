---
"kernl": patch
---

Add ModelRegistry and AgentRegistry classes to fix hydration issues when threads use model overrides. Models are now auto-registered in spawn/schedule methods.
