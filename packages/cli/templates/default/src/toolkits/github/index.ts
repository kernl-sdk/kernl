import { MCPToolkit, MCPServerStreamableHttp } from "kernl";

export const github = new MCPToolkit({
  id: "github",
  description: "GitHub connector via GitHub Copilot MCP",
  server: new MCPServerStreamableHttp({
    url: "https://api.githubcopilot.com/mcp/",
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    },
  }),
});
