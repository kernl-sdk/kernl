import { MCPToolkit, MCPServerStreamableHttp } from "@kernl-sdk/core";

import { env } from "@/lib/env";

export const linear = new MCPToolkit({
  id: "linear",
  description: "Linear issue tracking and project management",
  server: new MCPServerStreamableHttp({
    url: "https://mcp.linear.app/mcp",
    requestInit: {
      headers: {
        Authorization: `Bearer ${env.LINEAR_API_KEY}`,
      },
    },
  }),
});
