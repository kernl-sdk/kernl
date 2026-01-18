"use client";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ToolUIPart } from "ai";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  CodeIcon,
  XCircleIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { DiffChanges } from "./diff-changes";
import { DiffViewer } from "./diff-viewer";

type FileDiff = {
  file: string;
  before: string;
  after: string;
  additions: number;
  deletions: number;
};

type EditToolOutput = {
  success?: boolean;
  path?: string;
  diff?: FileDiff;
};

type EditToolProps = {
  part: ToolUIPart;
  className?: string;
};

const getStatusBadge = (status: ToolUIPart["state"]) => {
  const labels: Record<string, string> = {
    "input-streaming": "Pending",
    "input-available": "Running",
    "output-available": "Completed",
    "output-error": "Error",
  };

  const icons: Record<string, ReactNode> = {
    "input-streaming": <CircleIcon className="size-3" />,
    "input-available": <ClockIcon className="size-3 animate-pulse" />,
    "output-available": <CheckCircleIcon className="size-3 text-green-600" />,
    "output-error": <XCircleIcon className="size-3 text-red-600" />,
  };

  return (
    <Badge className="gap-1 rounded-full text-xs" variant="secondary">
      {icons[status]}
      {labels[status] ?? status}
    </Badge>
  );
};

function getFilename(path: string): string {
  return path.split("/").pop() ?? path;
}

function getDirectory(path: string): string {
  const parts = path.split("/");
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/") + "/";
}

export function EditTool({ part, className }: EditToolProps) {
  const input = (part.input as { path?: string; old?: string; new?: string }) ?? {};
  const output = part.output as EditToolOutput | undefined;
  const diff = output?.diff;

  const filePath = diff?.file ?? input?.path ?? "unknown";
  const filename = getFilename(filePath);
  const directory = getDirectory(filePath);

  const before = diff?.before ?? input?.old ?? "";
  const after = diff?.after ?? input?.new ?? "";

  return (
    <Collapsible
      className={cn("not-prose mb-4 w-full rounded-md border", className)}
      defaultOpen={true}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 p-3 group">
        <div className="flex items-center gap-2 min-w-0">
          <CodeIcon className="size-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-sm">Edit</span>
          <span className="text-muted-foreground text-sm truncate">
            {directory && (
              <span className="opacity-60">{directory}</span>
            )}
            {filename}
          </span>
          {getStatusBadge(part.state)}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {diff && (
            <DiffChanges
              additions={diff.additions}
              deletions={diff.deletions}
            />
          )}
          <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        {(before || after) && (
          <div className="border-t">
            <DiffViewer before={before} after={after} filename={filename} />
          </div>
        )}
        {part.errorText && (
          <div className="p-3 border-t bg-destructive/10 text-destructive text-sm">
            {part.errorText}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
