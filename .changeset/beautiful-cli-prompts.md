---
"@kernl-sdk/cli": minor
"create-kernl": minor
---

Add beautiful CLI prompts and create-kernl package

- Replace prompts + kleur with @clack/prompts for polished CLI UX with spinners, timeline markers, and boxed messages
- Add `create-kernl` package enabling `npm create kernl@latest`
- Add shadcn-style CLI flags: `--cwd`, `--yes`, `--defaults`, `--force`, `--pm`, `--silent`
- Update default template with GitHub MCP toolkit, postgres storage, and memory examples
- Fix registry schema to use proper types: `registry:toolkit`, `registry:agent`, `registry:skill`
