import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Brain } from "lucide-react";
import type { Agent } from "@/lib/kernl";

interface AgentDrawerProps {
  agent?: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentDrawer({ agent, open, onOpenChange }: AgentDrawerProps) {
  if (!agent) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-160" showClose={false}>
        <div className="relative flex flex-col items-center gap-3 py-8">
          <button
            onClick={() => onOpenChange(false)}
            className="group/close absolute left-8 top-8 flex cursor-pointer items-center text-brand outline-none focus:ring-0 focus-visible:ring-0"
          >
            <ChevronRight className="size-4 transition-transform duration-200 group-hover/close:translate-x-[3px]" />
            <ChevronRight className="-ml-2.5 size-4 transition-transform duration-200 group-hover/close:translate-x-[5px]" />
          </button>
          <Avatar className="size-10 bg-surface border-2 border-steel">
            <AvatarFallback className="bg-transparent text-base">
              {agent.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{agent.name}</span>
            {agent.toolkits.includes("sys.memory") && (
              <Brain className="size-4 text-neon-green" />
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 px-8">
          <div className="space-y-6 py-4">
            {agent.description && (
              <>
                <section>
                  <h3 className="mb-2 text-xs text-muted-foreground">
                    Description
                  </h3>
                  <p className="text-sm text-foreground">{agent.description}</p>
                </section>
                <Separator />
              </>
            )}

            <section>
              <h3 className="mb-2 text-xs text-muted-foreground">Model</h3>
              <p className="text-sm text-foreground">
                {agent.model.provider}/{agent.model.modelId}
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="mb-2 text-xs text-muted-foreground">Toolkits</h3>
              {agent.toolkits.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {agent.toolkits.map((toolkit) => (
                    <span
                      key={toolkit}
                      className="rounded-md bg-secondary px-2 py-1 text-xs"
                    >
                      {toolkit}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No toolkits</p>
              )}
            </section>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
