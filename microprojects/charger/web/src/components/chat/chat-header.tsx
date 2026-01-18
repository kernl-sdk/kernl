"use client";

import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";

/* componnents */
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme";
import { ThreadHistory } from "@/components/chat/history-dialog";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorName,
} from "@/components/ai-elements/model-selector";

const AGENTS = [
  { id: "jarvis", name: "Jarvis", provider: "openai" },
  { id: "atlas", name: "Atlas", provider: "anthropic" },
];

interface ChatHeaderProps {
  onNewChat: () => void;
  initialAgent?: string;
  onAgentChange?: (agentId: string) => void;
  currentThreadId?: string;
}

export function ChatHeader({
  onNewChat,
  initialAgent,
  onAgentChange,
  currentThreadId,
}: ChatHeaderProps) {
  const [selectedAgent, setSelectedAgent] = useState(
    AGENTS.find((a) => a.id === initialAgent) || AGENTS[0],
  );
  const [agentSelectorOpen, setAgentSelectorOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* new chat */}
        <Button
          variant="outline"
          size="icon"
          onClick={onNewChat}
          className="cursor-pointer rounded-full"
        >
          <Plus className="size-4" />
        </Button>

        {/* thread history */}
        <ThreadHistory
          currentThreadId={currentThreadId}
          agentId={selectedAgent.id}
        />
      </div>

      <div className="flex items-center gap-2">
        {/* agent selector */}
        <ModelSelector
          open={agentSelectorOpen}
          onOpenChange={setAgentSelectorOpen}
        >
          <ModelSelectorTrigger asChild>
            <Button variant="ghost" size="sm" className="cursor-pointer gap-2">
              <ModelSelectorLogo provider={selectedAgent.provider} />
              <span className="text-sm">{selectedAgent.name}</span>
              <ChevronDown className="size-4" />
            </Button>
          </ModelSelectorTrigger>
          <ModelSelectorContent>
            <ModelSelectorInput placeholder="Search agents..." />
            <ModelSelectorList>
              <ModelSelectorGroup heading="Available Agents">
                {AGENTS.map((agent) => (
                  <ModelSelectorItem
                    key={agent.id}
                    value={agent.id}
                    onSelect={() => {
                      setSelectedAgent(agent);
                      setAgentSelectorOpen(false);
                      onAgentChange?.(agent.id);
                    }}
                    className="cursor-pointer"
                  >
                    <ModelSelectorLogo provider={agent.provider} />
                    <ModelSelectorName>{agent.name}</ModelSelectorName>
                  </ModelSelectorItem>
                ))}
              </ModelSelectorGroup>
            </ModelSelectorList>
          </ModelSelectorContent>
        </ModelSelector>

        {/* theme toggle */}
        <ThemeToggle />
      </div>
    </div>
  );
}
