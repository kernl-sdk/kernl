import { useParams } from "react-router-dom";
import useSWR from "swr";

import { Chat } from "@/components/chat/chat";
import { kernl } from "@/lib/kernl";

export default function ThreadPage() {
  const { agentId, threadId } = useParams<{
    agentId: string;
    threadId: string;
  }>();

  const { data: messagesData, isLoading } = useSWR(
    threadId ? `thread:${threadId}:messages` : null,
    () => kernl.threads.messages(threadId!),
  );

  return (
    <Chat
      key={threadId}
      agentId={agentId || "echo"}
      threadId={threadId}
      initialMessages={messagesData?.messages}
      isLoading={isLoading}
    />
  );
}
