import useSWR from "swr";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { ArrowDown } from "lucide-react";

import { kernl } from "@/lib/kernl";

import { ConversationEmptyState } from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { AgentDrawer } from "@/components/sidebar/agent-drawer";
import { HistorySidebar } from "@/components/sidebar/history-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";

import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";

interface ChatProps {
  agentId: string;
  threadId?: string;
  initialMessages?: UIMessage[];
  isLoading?: boolean;
}

/**
 * Chat component implementing a pure state machine for thread management.
 *
 * States:
 * - STATE A (New Chat): threadId=undefined, tid=null, local session ID
 * - STATE B (Active Thread): threadId=tid=chatSessionId, messages loaded
 * - STATE C (Loading Thread): threadId set, fetching history
 *
 * Invariants:
 * - STATE A: tid=null, routeThreadId=null, messages=[]
 * - STATE B/C: routeThreadId=tid=chatSessionId (all same non-null id)
 */
export function Chat({
  agentId,
  threadId,
  initialMessages,
  isLoading,
}: ChatProps) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
  const { scrollRef, isAtBottom, scrollToBottom } = useScrollToBottom();

  // --- state machine ---
  // STATE A (New Chat): threadId is undefined
  // STATE B/C (Thread Mode): threadId is defined
  const isNewChat = threadId === undefined;

  // for STATE A: local-only session ID (never sent to server)
  // for STATE B/C: use threadId
  const [localSessionId] = useState(() => `local_${nanoid()}`);
  const chatSessionId = isNewChat ? localSessionId : threadId;

  // track the tid we'll send to server
  // - STATE A: null initially, set on first send
  // - STATE B/C: always threadId
  const tidRef = useRef<string | null>(isNewChat ? null : threadId);

  // sync tidRef when threadId changes (e.g., navigation to existing thread)
  useEffect(() => {
    tidRef.current = threadId ?? null;
  }, [threadId]);

  const { data: agentsData } = useSWR("agents", () => kernl.agents.list());
  const agent = agentsData?.agents.find((a) => a.id === agentId);

  const { messages, sendMessage, setMessages, status } = useChat({
    id: chatSessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages }) => ({
        api: `/api/agents/${agentId}/stream`,
        body: {
          tid: tidRef.current,
          message: messages[messages.length - 1],
          title: "$auto", // ignored after first message anyways
          titlerAgentId: "titler",
        },
      }),
    }),
    onError: (error) => {
      toast.error("Failed to send message", {
        description:
          error.message ||
          "An error occurred while communicating with the agent.",
      });
    },
  });

  // sync messages when initialMessages loads (STATE C → STATE B)
  useEffect(() => {
    if (initialMessages?.length && messages.length === 0) {
      setMessages(initialMessages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessages]);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text?.trim()) return;

      // STATE A → STATE B: First message in new chat
      if (isNewChat && tidRef.current === null) {
        const newTid = `thread_${nanoid()}`;
        tidRef.current = newTid;

        // update URL without causing remount (we're mid-stream)
        window.history.replaceState(null, "", `/agents/${agentId}/c/${newTid}`);
      }

      sendMessage({ text: message.text });
      setInput("");
    },
    [agentId, isNewChat, sendMessage],
  );

  // transition to STATE A: Clean reset via navigation
  const handleNewChat = useCallback(() => {
    navigate(`/agents/${agentId}`);
  }, [navigate, agentId]);

  // auto-scroll when new messages arrive
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (e.key === "s") {
        setAgentDrawerOpen((prev) => {
          if (!prev) setHistorySidebarOpen(false);
          return !prev;
        });
      } else if (e.key === "h") {
        setHistorySidebarOpen((prev) => {
          if (!prev) setAgentDrawerOpen(false);
          return !prev;
        });
      } else if (e.key === "j" && e.metaKey) {
        e.preventDefault();
        handleNewChat();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleNewChat]);

  // determine if we should show the greeting (STATE A with no messages)
  const showGreeting = messages.length === 0 && !isLoading;

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        onNewChat={handleNewChat}
        onOpenSettings={() => setAgentDrawerOpen(true)}
        onOpenHistory={() => setHistorySidebarOpen(true)}
      />

      {showGreeting ? (
        <ConversationEmptyState className="flex-1 h-auto justify-center -translate-y-[16vh] pointer-events-none">
          <div className="w-full max-w-2xl pointer-events-auto">
            {/* Agent identity */}
            <div className="flex flex-col items-center gap-3 mb-[60px]">
              <Avatar className="size-13 mb-2 bg-surface border-2 border-steel">
                <AvatarFallback className="bg-transparent text-base">
                  {agent?.name.charAt(0) ?? "?"}
                </AvatarFallback>
              </Avatar>
              <span className="text-lg font-semibold">
                {agent?.name ?? agentId}
              </span>
            </div>

            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              status={status}
            />
          </div>
        </ConversationEmptyState>
      ) : (
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <ScrollArea className="min-h-0 flex-1" viewportRef={scrollRef}>
            <div className="max-w-3xl mx-auto px-5 py-4 space-y-8">
              {messages.map((m) => (
                <Message key={m.id} from={m.role}>
                  <MessageContent>
                    {m.parts.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <MessageResponse key={`${m.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        );
                      }

                      if (isToolUIPart(part)) {
                        const toolTitle =
                          "toolName" in part
                            ? String(part.toolName)
                            : part.toolCallId;

                        return (
                          <Tool key={`${m.id}-${i}`}>
                            <ToolHeader
                              title={toolTitle}
                              type={part.type}
                              state={part.state}
                            />
                            <ToolContent>
                              {part.input !== undefined && (
                                <ToolInput input={part.input as object} />
                              )}
                              {(part.output !== undefined ||
                                part.errorText !== undefined) && (
                                <ToolOutput
                                  output={part.output as object}
                                  errorText={part.errorText}
                                />
                              )}
                            </ToolContent>
                          </Tool>
                        );
                      }

                      return null;
                    })}
                  </MessageContent>
                </Message>
              ))}
            </div>
          </ScrollArea>

          {/* Scroll to bottom button */}
          {!isAtBottom && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10">
              <Button
                size="icon"
                variant="outline"
                className="rounded-full"
                onClick={() => scrollToBottom()}
              >
                <ArrowDown className="size-4" />
              </Button>
            </div>
          )}

          <div className="shrink-0 py-4 px-5">
            <div className="max-w-2xl mx-auto">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                status={status}
              />
            </div>
          </div>
        </div>
      )}

      <AgentDrawer
        agent={agent}
        open={agentDrawerOpen}
        onOpenChange={setAgentDrawerOpen}
      />

      <HistorySidebar
        agentId={agentId}
        open={historySidebarOpen}
        onOpenChange={setHistorySidebarOpen}
      />
    </div>
  );
}
