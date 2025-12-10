"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface CodeSectionProps {
  agentCode: React.ReactNode;
  appCode: React.ReactNode;
}

export function CodeSection({ agentCode, appCode }: CodeSectionProps) {
  return (
    <>
      {/* Desktop: side by side */}
      <div className="hidden w-full max-w-6xl gap-6 min-[1624px]:flex min-[1900px]:max-w-7xl">
        <div key="app" className="flex-1">{appCode}</div>
        <div key="agent" className="flex-1">{agentCode}</div>
      </div>

      {/* Mobile/Tablet: tabs */}
      <div className="w-[calc(100vw-48px)] sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-2xl min-[1624px]:hidden">
        <Tabs defaultValue="app" className="w-full">
          <TabsList className="mb-4 bg-surface border border-border">
            <TabsTrigger value="app" className="font-mono text-xs">
              app.ts
            </TabsTrigger>
            <TabsTrigger value="jarvis" className="font-mono text-xs">
              jarvis.ts
            </TabsTrigger>
          </TabsList>
          <TabsContent value="app" className="min-h-[340px]">
            <div className="w-full">{appCode}</div>
          </TabsContent>
          <TabsContent value="jarvis" className="min-h-[340px]">
            <div className="w-full">{agentCode}</div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
