# kernl :: Agentic chatbot

A minimal Next.js chat app wired to a backend agent, built with the Vercel AI SDK and its **AI Elements** component library.

## Tech stack

- **Framework**: Next.js 16 (App Router, TypeScript, React 19)
- **AI**: Vercel AI SDK (`ai`, `@ai-sdk/react`) + **AI Elements** UI components
- **UI**: Tailwind CSS, Radix UI primitives, and local UI components in `src/components/ui`

## Project structure

```text
src/
  app/
    page.tsx
    chat/
    api/chat/
  components/
    ai-elements/
    chat/
    ui/
  lib/
  hooks/
```

## Getting started

- **Install dependencies**

```bash
pnpm install
```

- **Run the dev server**

```bash
pnpm dev
```

- Open `http://localhost:3000` in your browser.

- (Optional) Configure the backend base URL in `.env.local`:

```bash
API_BASE_URL=http://localhost:8080   # default if unset
```

## Docs

- **kernl**: [TODO]
- **Vercel AI SDK**: https://ai-sdk.dev/docs/introduction
- **AI Elements**: https://ai-sdk.dev/elements
