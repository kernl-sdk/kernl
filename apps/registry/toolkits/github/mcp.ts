import { MCPToolkit, MCPServerStreamableHttp } from "kernl";

export const github = new MCPToolkit({
  id: "mcp",
  description: "GitHub connector via GitHub Copilot MCP",
  server: new MCPServerStreamableHttp({
    url: "https://api.githubcopilot.com/mcp/",
    requestInit: {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    },
  }),
});
