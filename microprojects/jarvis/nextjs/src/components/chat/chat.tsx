"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DefaultChatTransport,
  type UIMessage,
  isToolUIPart,
  isReasoningUIPart,
} from "ai";
import { useChat } from "@ai-sdk/react";

/* components */
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { MessageResponse } from "@/components/ai-elements/message";
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatHeader } from "@/components/chat/chat-header";

const PROMPT_TEMPLATES = [
  "What are the latest trends in AI?",
  "How does machine learning work?",
  "Explain quantum computing",
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
}

export interface ChatProps {
  id?: string;
  initialMessages?: UIMessage[];
  initialAgent?: string;
}

export function Chat({
  id,
  initialMessages = [],
  initialAgent = "jarvis",
}: ChatProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [agent, setAgent] = useState(initialAgent);

  const { messages, sendMessage, status, error, stop } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      prepareSendMessagesRequest: ({ id, messages, body }) => {
        // NOTE: this is unfortunately the only way that you can send values through this; `body` or `metadata`
        const agentId = body?.agentId as string | undefined;
        if (!agentId) {
          throw new Error("agentId missing on request body");
        }

        return {
          api: `${API_BASE_URL}/v1/agents/${agentId}/stream`,
          body: {
            tid: id,
            message: messages[messages.length - 1],
          },
        };
      },
    }),
    onError: (error) => {
      toast.error("Failed to send message", {
        description:
          error.message ||
          "An error occurred while communicating with the agent.",
      });
    },
  });

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleNewChat = () => {
    router.push("/");
    router.refresh();
  };

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      // on first message, update URL to /chat/:id
      if (messages.length === 0 && id) {
        window.history.replaceState(null, "", `/chat/${id}`);
      }

      sendMessage(
        { text: message.text },
        {
          body: {
            agentId: agent,
          },
        },
      );
      setInput("");
    }
  };

  return (
    <div className="relative h-screen">
      {/* fixed header */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-background px-6 py-4 flex items-center">
        <div className="mx-auto w-full">
          <ChatHeader
            onNewChat={handleNewChat}
            initialAgent={agent}
            onAgentChange={setAgent}
            currentThreadId={id}
          />
        </div>
      </div>

      {/* main content with top padding for fixed header */}
      <div className="h-full pt-[72px] px-6 pb-6">
        <div className="flex flex-col h-full max-w-4xl mx-auto">
          <Conversation className="flex-1">
            <ConversationContent
              className={messages.length === 0 ? "h-full" : ""}
            >
              {messages.length === 0 ? (
                // empty state: centered input + suggestions
                <ConversationEmptyState>
                  <div className="w-full max-w-2xl space-y-4">
                    <ChatInput
                      value={input}
                      onChange={setInput}
                      onSubmit={handleSubmit}
                      status={status}
                    />
                    <Suggestions>
                      {PROMPT_TEMPLATES.map((prompt) => (
                        <Suggestion
                          key={prompt}
                          suggestion={prompt}
                          onClick={handleSuggestionClick}
                        />
                      ))}
                    </Suggestions>
                  </div>
                </ConversationEmptyState>
              ) : (
                // messages exist: show conversation
                messages.map((m) => (
                  <Message from={m.role} key={m.id}>
                    <MessageContent>
                      {m.parts.map((part, i) => {
                        const isLastPart = i === m.parts.length - 1;
                        const isLastMessage =
                          m.id === messages[messages.length - 1]?.id;
                        const isStreaming =
                          status === "streaming" && isLastPart && isLastMessage;

                        // Handle reasoning parts
                        if (isReasoningUIPart(part)) {
                          return (
                            <Reasoning
                              key={`${m.id}-${i}`}
                              className="w-full"
                              isStreaming={isStreaming}
                            >
                              <ReasoningTrigger />
                              <ReasoningContent>{part.text}</ReasoningContent>
                            </Reasoning>
                          );
                        }

                        // Handle tool parts
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

                        // Handle text parts
                        if (part.type === "text") {
                          return (
                            <MessageResponse key={`${m.id}-${i}`}>
                              {part.text}
                            </MessageResponse>
                          );
                        }

                        return null;
                      })}
                    </MessageContent>
                  </Message>
                ))
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* input at bottom once messages exist */}
          {messages.length > 0 && (
            <div className="mt-4 w-full max-w-2xl mx-auto">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSubmit}
                status={status}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
