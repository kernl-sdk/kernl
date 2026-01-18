import { MCPToolkit, MCPServerStreamableHttp } from "kernl";

import { env } from "@/lib/env";

export const web = new MCPToolkit({
  id: "web_search",
  description: "Real-time web search and content extraction via Parallel AI",
  server: new MCPServerStreamableHttp({
    url: "https://search-mcp.parallel.ai/mcp",
    requestInit: {
      headers: {
        Authorization: `Bearer ${env.PARALLEL_API_KEY}`,
      },
    },
  }),
});
