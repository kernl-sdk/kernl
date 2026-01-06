# Project Instructions for Claude Code

## Development Guidelines

- We use **pnpm** as our package manager
- At the beginning of any conversation, familiarize yourself with the repo structure
- Prefer method names with linux style, lowercase short words
- Never promote yourself in commits (no "Generated with Claude" messages)
- If we refactor something and are no longer using an old file, clean up after yourself

`pnpm build` is the build command - not `pnpm build:_` or anything else.

---

# Rule: Follow Established Patterns

**You must do this before proposing designs, writing code, or editing files:**

## 1) Follow established codebase patterns
- **Examine existing code** to understand established patterns, conventions, and architectural decisions
- **Maintain consistency** with existing naming conventions, file structures, and coding patterns
- **Reuse existing patterns** rather than inventing new ones unless explicitly required
- If you must deviate from existing patterns, explicitly justify why

## 2) If requirements are ambiguous
- **Ask clarifying questions** before implementing
- If proposing new patterns, explain the rationale

## Checklists

### Before coding
- [ ] I examined existing codebase patterns for similar functionality
- [ ] I verified my approach is consistent with established conventions
