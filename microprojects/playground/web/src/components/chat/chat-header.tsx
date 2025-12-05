import { Plus, SlidersVertical, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatHeaderProps {
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export function ChatHeader({
  onNewChat,
  onOpenSettings,
  onOpenHistory,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-end px-7 py-5">
      <div className="flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className="rounded-full"
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
              className="rounded-full"
            >
              <History className="size-4.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            History <Kbd className="h-4 min-w-4 text-[10px]">H</Kbd>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewChat}
              className="ml-1.5 cursor-pointer rounded-full border"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="flex items-center gap-2">
            New chat <Kbd className="h-4 min-w-4 text-[10px]">⌘J</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
