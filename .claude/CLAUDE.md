# Project Instructions for Claude Code

## Development Guidelines

- We use **pnpm** as our package manager
- At the beginning of any conversation, familiarize yourself with the repo structure
- Prefer method names with linux style, lowercase short words
- Never promote yourself in commits (no "Generated with Claude" messages)
- If we refactor something and are no longer using an old file, clean up after yourself

`pnpm build` is the build command - not `pnpm build:_` or anything else.

---

# Rule: Read the Docs First

**You must do this before proposing designs, writing code, or editing files:**

## 1) Read the canonical specs in `/docs/`
Review the relevant files and design constraints before you suggest anything.

## 2) Follow established codebase patterns
- **Examine existing code** to understand established patterns, conventions, and architectural decisions
- **Maintain consistency** with existing naming conventions, file structures, and coding patterns
- **Reuse existing patterns** rather than inventing new ones unless the spec explicitly requires deviation
- If you must deviate from existing patterns, explicitly justify why based on the `/docs/` specifications

## 3) If the spec is missing or ambiguous
- **Stop and propose a spec addition** first (succinct ADR-style note). Do not implement until the spec gap is resolved.
- Offer a default, but mark it as **"Proposed addition to /docs"**.

## Checklists

### Before coding
- [ ] I looked up the relevant `/docs/*` file(s).
- [ ] I examined existing codebase patterns for similar functionality.
- [ ] I verified my approach is consistent with established conventions.
