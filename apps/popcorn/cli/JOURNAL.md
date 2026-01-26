# Popcorn Worker Loading Journal

1. Hardcoded `POPCORN_WORKER_PATH` to `/$bunfs/root/src/worker.ts` -> `ModuleNotFound` outside repo.
2. `new URL("../worker.ts", import.meta.url)` in `apps/popcorn/cli/src/cmd/default.ts` -> resolved to `/$bunfs/worker.ts`, still `ModuleNotFound`.
3. Restored worker as explicit entrypoint + `POPCORN_WORKER_PATH` string (`"./src/worker.ts"`) -> still `ModuleNotFound` after install.
4. Switched to Bun docs pattern `new URL("../worker.ts", import.meta.url).href` (no `type: "module"`) + worker entrypoint -> still `ModuleNotFound`.
5. Added `root: "."` to `Bun.build` (keep entrypoints under `/$bunfs/root`) + worker path via `new URL("../worker.ts", import.meta.url).href` -> `ModuleNotFound resolving "/$bunfs/root/worker.ts" (entry point)`.
6. Passed URL object to `Worker` and removed worker entrypoint to rely on bundler discovery -> still `ModuleNotFound`, compiled binary did not embed worker module.
7. Added runtime worker path resolver that probes candidate paths with `Bun.file(...).exists()` -> works; exact path not yet logged.
8. Debug logs show compiled worker path resolves to `/$bunfs/root/src/worker.js`; removed resolver and hard-coded compiled path with dev fallback.
