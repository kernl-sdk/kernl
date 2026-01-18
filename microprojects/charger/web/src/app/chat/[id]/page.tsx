import { notFound } from "next/navigation";

import { kernl } from "@/lib/kernl/server";
import { KernlApiError } from "@/lib/kernl";
import { Chat } from "@/components/chat/chat";

const DEFAULT_AGENT = "jarvis";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;

  let thread;
  let messages;
  try {
    [thread, { messages }] = await Promise.all([
      kernl.threads.get(id),
      kernl.threads.messages(id),
    ]);
  } catch (error) {
    if (error instanceof KernlApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <Chat
      id={thread.tid}
      initialMessages={messages ?? []}
      initialAgent={thread.agentId ?? DEFAULT_AGENT}
    />
  );
}
