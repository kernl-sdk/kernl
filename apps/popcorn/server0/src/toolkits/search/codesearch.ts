import { z } from "zod";
import { tool } from "kernl";

const DESCRIPTION = `- Search and get relevant context for any programming task using Exa Code API
- Provides the highest quality and freshest context for libraries, SDKs, and APIs
- Use this tool for ANY question or task related to programming
- Returns comprehensive code examples, documentation, and API references
- Optimized for finding specific programming patterns and solutions

Usage notes:
  - Adjustable token count (1000-50000) for focused or comprehensive results
  - Default 5000 tokens provides balanced context for most queries
  - Use lower values for specific questions, higher values for comprehensive documentation
  - Supports queries about frameworks, libraries, APIs, and programming concepts
  - Examples: 'React useState hook examples', 'Python pandas dataframe filtering', 'Express.js middleware'`;

interface ExaContextResponse {
  requestId: string;
  query: string;
  response: string;
  resultsCount: number;
  costDollars: string;
  searchTime: number;
  outputTokens: number;
}

/**
 * @tool
 *
 * Search and get relevant context for programming tasks.
 * Returns code examples, documentation, and API references from Exa Code.
 */
export const codesearch = tool({
  id: "codesearch",
  description: DESCRIPTION,
  parameters: z.object({
    query: z
      .string()
      .describe(
        "Search query to find relevant context for APIs, Libraries, and SDKs. For example, 'React useState hook examples', 'Python pandas dataframe filtering', 'Express.js middleware', 'Next js partial prerendering configuration'",
      ),
    tokensNum: z
      .number()
      .min(1000)
      .max(50000)
      .optional()
      .describe(
        "Number of tokens to return (1000-50000). Default is 5000 tokens. Use lower values for focused queries, higher for comprehensive documentation.",
      ),
  }),
  async execute(ctx, params) {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      throw new Error("EXA_API_KEY environment variable is not set");
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("https://api.exa.ai/context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          query: params.query,
          tokensNum: params.tokensNum ?? 5000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Code search error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as ExaContextResponse;

      if (!data.response) {
        return "No code snippets or documentation found. Please try a different query, be more specific about the library or programming concept, or check the spelling of framework names.";
      }

      return data.response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Code search request timed out");
      }

      throw error;
    }
  },
});
