"use client";

import useSWR from "swr";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart, type UIMessage } from "ai";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { ArrowDown } from "lucide-react";

import { kernl } from "@/lib/kernl";

/* components */
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
import { EditTool } from "@/components/tools";
import {
  AttachmentPill,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { AgentDrawer } from "@/components/sidebar/agent-drawer";
import { HistorySidebar } from "@/components/sidebar/history-sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom";

import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

interface ChatProps {
  id?: string;
  initialMessages?: UIMessage[];
  initialAgent?: string;
}

const DEFAULT_AGENT = "watson";

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
  id,
  initialMessages,
  initialAgent = DEFAULT_AGENT,
}: ChatProps) {
  const router = useRouter();
  const threadId = id;

  // Agent selection - only changeable for new chats (no threadId)
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgent);
  const agentId = threadId ? initialAgent : selectedAgentId;
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

  // refs for the transport closure to read current values
  const tidRef = useRef<string | null>(isNewChat ? null : threadId);
  const agentIdRef = useRef(agentId);

  // sync refs when values change
  useEffect(() => {
    tidRef.current = threadId ?? null;
  }, [threadId]);

  useEffect(() => {
    agentIdRef.current = agentId;
  }, [agentId]);

  const { data: agentsData } = useSWR("agents", () => kernl.agents.list());
  const agent = agentsData?.agents.find((a) => a.id === agentId);

  const { messages, sendMessage, setMessages, status } = useChat({
    id: chatSessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ messages }) => ({
        api: `${API_BASE_URL}/agents/${agentIdRef.current}/stream`,
        body: {
          tid: tidRef.current,
          message: messages[messages.length - 1],
          title: "$auto",
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
      const hasText = Boolean(message.text?.trim());
      const hasFiles = Boolean(message.files?.length);
      if (!hasText && !hasFiles) return;

      // STATE A → STATE B: First message in new chat
      if (isNewChat && tidRef.current === null) {
        const newTid = `thread_${nanoid()}`;
        tidRef.current = newTid;

        // update URL without causing remount (we're mid-stream)
        window.history.replaceState(null, "", `/chat/${newTid}`);
      }

      sendMessage({
        text: message.text || "",
        files: message.files,
      });
      setInput("");
    },
    [isNewChat, sendMessage],
  );

  // transition to STATE A: Clean reset
  const handleNewChat = useCallback(() => {
    tidRef.current = null;
    setMessages([]);
    setInput("");
    router.push("/");
  }, [router, setMessages]);

  // handle agent change - only works for new chats (before first message sent)
  const handleAgentChange = useCallback(
    (newAgentId: string) => {
      // Can only change agent if no thread exists yet (prop or created)
      if (!threadId && tidRef.current === null) {
        setSelectedAgentId(newAgentId);
      }
    },
    [threadId],
  );

  // auto-scroll when new messages arrive
  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // determine if we should show the greeting (STATE A with no messages)
  const showGreeting = messages.length === 0;

  // Agent is locked once a thread exists (either from prop or created on first message)
  const isAgentLocked = Boolean(threadId) || messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        agentId={agentId}
        agents={agentsData?.agents}
        isAgentLocked={isAgentLocked}
        onAgentChange={handleAgentChange}
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

                      if (part.type === "file") {
                        return (
                          <AttachmentPill key={`${m.id}-${i}`} data={part} />
                        );
                      }

                      if (isToolUIPart(part)) {
                        // Extract tool name from toolName prop, or from type (e.g. "tool-get_thread")
                        const toolName =
                          "toolName" in part
                            ? String(part.toolName)
                            : part.type.startsWith("tool-")
                              ? part.type.replace(/^tool-/, "")
                              : part.toolCallId;

                        // Route edit tool to specialized component
                        if (toolName === "fs_edit") {
                          return <EditTool key={`${m.id}-${i}`} part={part} />;
                        }

                        return (
                          <Tool key={`${m.id}-${i}`}>
                            <ToolHeader
                              title={toolName}
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
