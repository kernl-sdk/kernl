import { useState } from "react";
import { useParams, Link } from "react-router-dom";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { IconMCPToolkit, IconFunctionToolkit, IconFunction, IconWrench } from "@/components/ui/icons";
import { Rss, Copy, Check, ChevronLeft } from "lucide-react";

interface Tool {
  id: string;
  name: string;
  description: string;
}

interface Toolkit {
  id: string;
  name: string;
  description: string;
  type: "mcp" | "function";
  url?: string;
  tools: Tool[];
}

// TODO: wire up to GET /toolkits/:id endpoint
const toolkits: Record<string, Toolkit> = {
  github: {
    id: "github",
    name: "Github",
    description: "A lightweight planning + coordination agent powered by Linear and GitHub.",
    type: "mcp",
    url: "https://api.githubcopilot.com/mcp/",
    tools: [
      { id: "list-issues", name: "List issues", description: "List all of the issues associated with a given repository" },
      { id: "get-repo", name: "Get repository", description: "Get the metadata associated with a repository." },
      { id: "create-issue", name: "Create issue", description: "Create a new issue in a repository." },
      { id: "get-pr", name: "Get pull request", description: "Get the details of a pull request." },
      { id: "list-prs", name: "List pull requests", description: "List all pull requests for a repository." },
      { id: "merge-pr", name: "Merge pull request", description: "Merge a pull request into the base branch." },
    ],
  },
  linear: {
    id: "linear",
    name: "Linear",
    description: "Linear MCP server for issue tracking and project management.",
    type: "mcp",
    url: "https://api.linear.app/mcp/",
    tools: [
      { id: "list-issues", name: "List issues", description: "List issues from Linear workspace." },
      { id: "create-issue", name: "Create issue", description: "Create a new issue in Linear." },
    ],
  },
  math: {
    id: "math",
    name: "Math",
    description: "A toolkit with various math operations.",
    type: "function",
    tools: [
      { id: "add", name: "Add", description: "Add two numbers together." },
      { id: "multiply", name: "Multiply", description: "Multiply two numbers." },
      { id: "divide", name: "Divide", description: "Divide one number by another." },
    ],
  },
};

export default function ToolkitPage() {
  const { toolkitId } = useParams<{ toolkitId: string }>();
  const toolkit = toolkits[toolkitId ?? ""];
  const [copied, setCopied] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const copyUrl = async () => {
    if (!toolkit?.url) return;
    await navigator.clipboard.writeText(toolkit.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  if (!toolkit) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Toolkit not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col pt-[4%]">
      {/* Header */}
      <div className="mx-auto w-full max-w-3xl px-8">
        <div className="relative flex flex-col items-center py-12">
          <Link
            to="/toolkits"
            className="group absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          </Link>
          {toolkit.type === "mcp" ? (
            <IconMCPToolkit className="size-8 mb-3" />
          ) : (
            <IconFunctionToolkit className="size-8 mb-3" />
          )}
          <h1 className="text-xl font-semibold">{toolkit.name}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-3xl px-8">
        {/* Description */}
        <div className="flex flex-col gap-3">
          <span className="text-xs text-muted-foreground">Description</span>
          <p className="text-sm">{toolkit.description}</p>
        </div>

        {/* URL + Badge */}
        <div className="flex items-center gap-3 mt-6">
          {toolkit.url && (
            <button
              onClick={copyUrl}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="relative size-3">
                <Copy
                  className={`absolute inset-0 size-3 text-muted transition-all duration-200 ${
                    copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                  }`}
                />
                <Check
                  className={`absolute inset-0 size-3 text-brand transition-all duration-200 ${
                    copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                />
              </div>
              <span className="font-mono text-xs text-brand">
                {toolkit.url}
              </span>
            </button>
          )}
          <Badge variant="outline" className="gap-1.5 bg-surface">
            {toolkit.type === "mcp" ? (
              <Rss className="size-3" />
            ) : (
              <IconFunction className="size-3" />
            )}
            {toolkit.type === "mcp" ? "MCP" : "Function"}
          </Badge>
        </div>

        <Separator className="my-8" />

        {/* Tools */}
        <div className="space-y-6">
          <span className="text-sm font-semibold text-foreground mb-4 block">Tools</span>

          <div className="grid grid-cols-3 gap-4">
            {toolkit.tools.map((tool, index) => (
              <div
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className="relative flex flex-col items-center gap-2 rounded-md border border-border/50 bg-card/50 px-5 pt-6 pb-8 text-center cursor-pointer transition-colors duration-200 hover:border-steel"
              >
                <span className="absolute left-2.5 top-2.5 font-mono text-[10px] text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="space-y-2">
                  <span className="text-xs text-muted">{tool.id}</span>
                  <p className="text-base font-medium mb-2">{tool.name}</p>
                </div>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tool Detail Dialog */}
      <Dialog open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-4xl p-0 gap-0 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col items-center text-center pt-8 pb-6 border-b border-border/50">
            <IconWrench className="size-5 mb-4" />
            <DialogHeader className="items-center">
              <DialogDescription className="text-xs text-muted">
                {selectedTool?.id}
              </DialogDescription>
              <DialogTitle>{selectedTool?.name}</DialogTitle>
            </DialogHeader>
            <p className="mt-3 text-xs text-muted-foreground max-w-md">
              {selectedTool?.description}
            </p>
          </div>

          {/* Content */}
          <div className="grid grid-cols-2 min-h-[400px] divide-x divide-border/50">
            {/* Left - Params */}
            <div className="px-6 py-4">
              <span className="text-xs text-muted-foreground">Parameters</span>
              <div className="mt-2 space-y-4">
                {/* TODO: render tool params here */}
                <p className="text-xs text-muted">No parameters defined</p>
              </div>
            </div>

            {/* Right - Result */}
            <div className="px-6 py-4">
              <span className="text-xs text-muted-foreground">Result</span>
              <div className="mt-2">
                <p className="text-xs text-muted">Run the tool to see results</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
