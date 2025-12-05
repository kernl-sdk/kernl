import { useParams } from "react-router-dom";

import { Chat } from "@/components/chat/chat";

export default function AgentChatPage() {
  const { agentId } = useParams<{ agentId: string }>();

  return <Chat key="new" agentId={agentId || "echo"} />;
}
