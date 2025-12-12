import type { RegistryItem } from "./types";

export const toolkits: RegistryItem[] = [
  {
    name: "github",
    type: "registry:toolkit",
    title: "GitHub",
    description: "GitHub connector via GitHub Copilot MCP",
    icon: "https://registry.kernl.sh/icons/github.svg",
    category: "developer-tools",
    env: ["GITHUB_TOKEN"],
    files: [{ path: "toolkits/github/index.ts" }],
  },
  {
    name: "linear",
    type: "registry:toolkit",
    title: "Linear",
    description: "Linear issue tracking and project management",
    icon: "https://registry.kernl.sh/icons/linear.svg",
    category: "project-management",
    env: ["LINEAR_API_KEY"],
    files: [{ path: "toolkits/linear/index.ts" }],
  },
  {
    name: "exa",
    type: "registry:toolkit",
    title: "Exa",
    description: "Real-time web search and code context via Exa AI",
    icon: "https://registry.kernl.sh/icons/exa.svg",
    category: "search",
    env: ["EXA_API_KEY"],
    files: [{ path: "toolkits/exa/index.ts" }],
  },
  {
    name: "parallel",
    type: "registry:toolkit",
    title: "Parallel",
    description: "Real-time web search and content extraction via Parallel AI",
    icon: "https://registry.kernl.sh/icons/parallel.svg",
    category: "search",
    env: ["PARALLEL_API_KEY"],
    files: [{ path: "toolkits/parallel/index.ts" }],
  },
];
