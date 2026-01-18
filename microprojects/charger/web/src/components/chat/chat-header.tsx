"use client";

import { Plus, SlidersVertical, History } from "lucide-react";

import type { AgentResource } from "@/lib/kernl/types";

/* components */
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHeaderProps {
  agentId: string;
  agents?: AgentResource[];
  isAgentLocked?: boolean;
  onAgentChange: (agentId: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export function ChatHeader({
  agentId,
  agents,
  isAgentLocked,
  onAgentChange,
  onNewChat,
  onOpenSettings,
  onOpenHistory,
}: ChatHeaderProps) {
  const currentAgent = agents?.find((a) => a.id === agentId);

  return (
    <header className="flex items-center justify-between px-7 py-5">
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewChat}
              className="cursor-pointer rounded-full border"
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            New chat <Kbd className="h-4 min-w-4 text-[10px]">⌘J</Kbd>
          </TooltipContent>
        </Tooltip>
        <Select value={agentId} onValueChange={onAgentChange}>
          <SelectTrigger className="w-auto min-w-[120px] gap-1 border-none bg-transparent shadow-none hover:bg-accent dark:bg-transparent">
            <SelectValue placeholder="Select agent">
              {currentAgent?.name ?? agentId}
            </SelectValue>
          </SelectTrigger>
          <SelectContent align="start">
            {agents?.map((agent) => (
              <SelectItem
                key={agent.id}
                value={agent.id}
                disabled={isAgentLocked && agent.id !== agentId}
              >
                {agent.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className="cursor-pointer rounded-full"
            >
              <SlidersVertical className="size-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            Settings <Kbd className="h-4 min-w-4 text-[10px]">S</Kbd>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenHistory}
              className="cursor-pointer rounded-full"
            >
              <History className="size-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            History <Kbd className="h-4 min-w-4 text-[10px]">H</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
