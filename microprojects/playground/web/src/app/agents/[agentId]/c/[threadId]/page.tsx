import { useParams } from "react-router-dom";
import useSWR from "swr";

import { Chat } from "@/components/chat/chat";
import { kernl } from "@/lib/kernl";

export default function ThreadPage() {
  const { agentId, threadId } = useParams<{
    agentId: string;
    threadId: string;
  }>();

  const { data: thread, isLoading } = useSWR(
    threadId ? `thread:${threadId}` : null,
    () => kernl.threads.get(threadId!)
  );

  return (
    <Chat
      key={threadId}
      agentId={agentId || "echo"}
      threadId={threadId}
      initialMessages={thread?.history}
      isLoading={isLoading}
    />
  );
}
