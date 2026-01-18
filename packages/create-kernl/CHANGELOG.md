# create-kernl

## 0.2.7

### Patch Changes

- 7b2520b: Bump to pull latest @kernl-sdk/cli with template fixes

## 0.2.6

### Patch Changes

- Updated dependencies [7ebf24e]
  - @kernl-sdk/cli@0.6.0

## 0.2.5

### Patch Changes

- update @kernl-sdk/cli dependency to ^0.4.0

## 0.2.4

### Patch Changes

- Updated dependencies
  - @kernl-sdk/cli@0.4.0

## 0.2.3

### Patch Changes

- Fix workspace protocol in published package

## 0.2.2

### Patch Changes

- Trigger publish workflow
- Updated dependencies
  - @kernl-sdk/cli@0.3.2

## 0.2.1

### Patch Changes

- Trigger initial trusted publishing
- Updated dependencies
  - @kernl-sdk/cli@0.3.1

## 0.2.0

### Minor Changes

- b03ced4: Add beautiful CLI prompts and create-kernl package
  - Replace prompts + kleur with @clack/prompts for polished CLI UX with spinners, timeline markers, and boxed messages
  - Add `create-kernl` package enabling `npm create kernl@latest`
  - Add shadcn-style CLI flags: `--cwd`, `--yes`, `--defaults`, `--force`, `--pm`, `--silent`
  - Update default template with GitHub MCP toolkit, postgres storage, and memory examples
  - Fix registry schema to use proper types: `registry:toolkit`, `registry:agent`, `registry:skill`

### Patch Changes

- Updated dependencies [b03ced4]
  - @kernl-sdk/cli@0.3.0
