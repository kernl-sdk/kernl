import { MCPToolkit, MCPServerStreamableHttp } from "@kernl-sdk/core";

import { env } from "@/lib/env";

export const github = new MCPToolkit({
  id: "github",
  description: "GitHub connector",
  server: new MCPServerStreamableHttp({
    url: "https://api.githubcopilot.com/mcp/",
    requestInit: {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      },
    },
  }),
});
