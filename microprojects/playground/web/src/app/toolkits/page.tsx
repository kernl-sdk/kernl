import { Link } from "react-router-dom";

import { Separator } from "@/components/ui/separator";
import {
  IconMCPToolkit,
  IconFunctionToolkit,
  IconWrench,
} from "@/components/ui/icons";

interface Toolkit {
  id: string;
  name: string;
  description: string;
  type: "mcp" | "function";
  agentCount: number;
}

// TODO: wire up to GET /toolkits endpoint
const toolkits: Toolkit[] = [
  {
    id: "github",
    name: "Github",
    description: "Github MCP server",
    type: "mcp",
    agentCount: 1,
  },
  {
    id: "linear",
    name: "Linear",
    description: "Linear MCP server",
    type: "mcp",
    agentCount: 2,
  },
  {
    id: "math",
    name: "Math",
    description: "A toolkit with various math operations",
    type: "function",
    agentCount: 1,
  },
];

export default function ToolkitsPage() {
  return (
    <div className="flex h-full flex-col pt-[4%]">
      {/* header */}
      <div className="flex flex-col items-center py-12">
        <IconWrench className="size-5 mb-3" />
        <h1 className="text-xl font-semibold">Toolkits</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Browse and manage your toolkits
        </p>
      </div>

      {/* content */}
      <div className="mx-auto w-full max-w-3xl px-8">
        <Separator className="mb-8" />

        {/* toolkits List */}
        <div className="space-y-10">
          {toolkits.map((toolkit, index) => (
            <Link
              key={toolkit.id}
              to={`/toolkits/${toolkit.id}`}
              className="group flex items-center gap-4 transition-colors"
            >
              <span className="w-4 text-sm text-muted group-hover:text-brand transition-colors duration-200">
                {index + 1}
              </span>

              <div className="flex size-9 items-center justify-center">
                {toolkit.type === "mcp" ? (
                  <IconMCPToolkit className="size-8" />
                ) : (
                  <IconFunctionToolkit className="size-8" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">
                    {toolkit.name}
                  </span>
                  <span className="text-xs text-muted">{toolkit.id}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {toolkit.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
