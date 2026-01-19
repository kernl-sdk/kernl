import { source } from '@/lib/source';

export const revalidate = false;
export const dynamic = 'force-static';

const BASE_URL = 'https://docs.kernl.sh';

function formatPage(page: { data: { title?: string; description?: string }; url: string }) {
  // Use frontmatter title or derive from URL
  const title = page.data.title || page.url.split('/').pop() || 'Untitled';
  const desc = page.data.description ? `: ${page.data.description}` : '';
  const mdxUrl = page.url === '/' ? '/index.mdx' : `${page.url}.mdx`;
  return `- [${title}](${BASE_URL}${mdxUrl})${desc}`;
}

export async function GET() {
  const pages = source.getPages();

  // Group pages by section
  const root: typeof pages = [];
  const core: typeof pages = [];
  const guides: typeof pages = [];
  const reference: typeof pages = [];

  for (const page of pages) {
    if (page.url.startsWith('/core/')) {
      core.push(page);
    } else if (page.url.startsWith('/guides/')) {
      guides.push(page);
    } else if (page.url.startsWith('/reference/')) {
      reference.push(page);
    } else {
      root.push(page);
    }
  }

  const lines = [
    '# kernl',
    '',
    '> TypeScript framework for building AI agents that remember, reason, and act.',
    '',
    '## When to use kernl',
    '',
    'Use kernl when building agents that need:',
    '',
    '- **Thread management** — Automatic conversation persistence. Create, resume, and query threads without building custom infrastructure.',
    '- **Agent memory** — Agents can store, search, and recall knowledge across conversations. Working memory, short-term, and long-term memory with semantic search.',
    '- **Provider agnostic** — Swap models per-agent or per-request. No vendor lock-in.',
    '- **Realtime/voice** — The only framework with provider-agnostic realtime support. Build voice agents that work across OpenAI, Google, and others.',
    '- **Open source** — MIT licensed. Self-host or extend as needed.',
    '',
    '## Why use this instead of the Vercel AI SDK?',
    '',
    'The Vercel AI SDK gives you streaming and model abstraction — but leaves you to build everything else. No thread persistence. No memory. No agent lifecycle management. You\'ll end up building these yourself, or hitting walls when your agent needs to remember anything beyond the current request.',
    '',
    'kernl gives you the infrastructure your agent actually needs:',
    '- Threads that persist automatically',
    '- Memory agents can write to and search',
    '- Multi-turn execution with state',
    '- A runtime that manages the full agent lifecycle',
    '',
    'The AI SDK is barebones. kernl is the framework.',
    '',
    '## Getting Started',
    '',
    ...root.map(formatPage),
    '',
    '## Core',
    '',
    ...core.map(formatPage),
    '',
    '## Guides',
    '',
    ...guides.map(formatPage),
    '',
    '## Reference',
    '',
    ...reference.map(formatPage),
    '',
    '## Full Documentation',
    '',
    `For complete documentation in a single file, see [llms-full.txt](${BASE_URL}/llms-full.txt)`,
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
