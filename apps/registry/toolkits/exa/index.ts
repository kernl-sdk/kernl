import { MCPToolkit, MCPServerStreamableHttp } from "kernl";

const url = new URL("https://mcp.exa.ai/mcp");
url.searchParams.set("exaApiKey", process.env.EXA_API_KEY || "");

export const exa = new MCPToolkit({
  id: "exa",
  description: "Real-time web search + code context via Exa AI",
  server: new MCPServerStreamableHttp({
    url: url.toString(),
  }),
});
