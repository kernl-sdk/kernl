import { z } from "zod";
import { Toolkit, tool } from "kernl";

const ALLOWED_DOMAINS = [
  "arxiv.org",
  "docs.kernl.sh",
];

function isallowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`),
    );
  } catch {
    return false;
  }
}

function extracttext(html: string): string {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Remove HTML tags but keep content
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  // Truncate if too long (keep first 50k chars)
  if (text.length > 50000) {
    text = text.slice(0, 50000) + "\n\n[Content truncated...]";
  }

  return text;
}

const fetchpage = tool({
  id: "fetch",
  description: `Fetch a web page and extract its text content.
Use this to read full arXiv papers or kernl docs:
- Papers: fetch("https://arxiv.org/html/2601.12345")
- Docs: fetch("https://docs.kernl.sh/core/memory")`,
  parameters: z.object({
    url: z.string().url().describe("The URL to fetch"),
  }),
  execute: async (ctx, { url }) => {
    if (!isallowed(url)) {
      return `Error: Domain not allowed. Only arxiv.org and docs.kernl.sh are permitted.`;
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "arxiv-scout/1.0 (research paper analyzer)",
        },
        redirect: "follow",
      });

      if (!response.ok) {
        return `Error: HTTP ${response.status} ${response.statusText}`;
      }

      const html = await response.text();
      const text = extracttext(html);

      if (text.length < 100) {
        return `Error: Page content too short (${text.length} chars). HTML may not be available for this paper.`;
      }

      return text;
    } catch (error) {
      return `Error fetching URL: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
});

export const fetchkit = new Toolkit({
  id: "fetch",
  description: "Fetch arXiv papers or kernl documentation",
  tools: [fetchpage],
});
