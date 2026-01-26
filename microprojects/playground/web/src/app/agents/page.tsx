import { Link } from "react-router-dom";
import useSWR from "swr";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconAgents } from "@/components/ui/icons";
import { kernl } from "@/lib/kernl";
// TODO: Re-enable when kernl/realtime is browser-safe (#50)
// import { watson } from "@/agents/watson";

// const realtimeAgents = [watson];
const realtimeAgents: { id: string; name: string; description: string }[] = [];

export default function AgentsPage() {
  const { data, isLoading } = useSWR("agents", () => kernl.agents.list());
  const agents = data?.agents ?? [];

  return (
    <div className="flex h-full flex-col pt-[4%]">
      {/* header */}
      <div className="flex flex-col items-center py-12">
        <IconAgents className="size-5 mb-3" />
        <h1 className="text-xl font-semibold">Agents</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Inspect and test your agents
        </p>
      </div>

      {/* content */}
      <div className="mx-auto w-full max-w-3xl px-8">
        <Tabs defaultValue="llm">
          <TabsList className="border-b border-border w-full mb-8">
            <TabsTrigger value="llm">LLM</TabsTrigger>
            <TabsTrigger value="realtime">Realtime</TabsTrigger>
          </TabsList>

          {/* LLM agents */}
          <TabsContent value="llm">
            <div className="space-y-8">
              {isLoading ? (
                <p className="text-center text-sm text-muted-foreground">
                  Loading...
                </p>
              ) : agents.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No agents registered
                </p>
              ) : (
                agents.map((agent, index) => (
                  <Link
                    key={agent.id}
                    to={`/agents/${agent.id}`}
                    className="group flex items-center gap-4 transition-colors"
                  >
                    <span className="w-4 text-sm text-muted group-hover:text-brand transition-colors duration-200">
                      {index + 1}
                    </span>

                    <Avatar className="size-9 border border-steel bg-surface">
                      <AvatarFallback className="bg-transparent text-sm">
                        {agent.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {agent.name}
                        </span>
                        <span className="text-xs text-muted">{agent.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {agent.description ??
                          `${agent.model.provider}/${agent.model.modelId}`}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </TabsContent>

          {/* Realtime agents */}
          <TabsContent value="realtime">
            <div className="space-y-8">
              {realtimeAgents.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No realtime agents defined
                </p>
              ) : (
                realtimeAgents.map((agent, index) => (
                  <Link
                    key={agent.id}
                    to={`/agents/${agent.id}/voice`}
                    className="group flex items-center gap-4 transition-colors"
                  >
                    <span className="w-4 text-sm text-muted group-hover:text-brand transition-colors duration-200">
                      {index + 1}
                    </span>

                    <Avatar className="size-9 border border-steel bg-surface">
                      <AvatarFallback className="bg-transparent text-sm">
                        {agent.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {agent.name}
                        </span>
                        <span className="text-xs text-muted">{agent.id}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {agent.description}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
