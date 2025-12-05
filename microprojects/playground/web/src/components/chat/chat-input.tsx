import { Mic, Plus } from "lucide-react";
import type { ChatStatus } from "ai";

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  status: ChatStatus;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  status,
  placeholder = "What's on the agenda?",
}: ChatInputProps) {
  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;
    onSubmit(message);
  };

  return (
    <PromptInput onSubmit={handleSubmit} className="chat-input relative rounded-full border bg-surface py-[5px]">
      {/* left toolbar */}
      <PromptInputTools className="pl-4">
        <PromptInputButton className="cursor-pointer rounded-full">
          <Plus className="size-5" />
        </PromptInputButton>
      </PromptInputTools>

      {/* textarea */}
      <PromptInputTextarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="min-h-0 pl-4 pr-24 !text-[15px]"
      />

      {/* right toolbar */}
      <PromptInputTools className="absolute right-4 flex items-center gap-2">
        <PromptInputButton className="cursor-pointer rounded-full">
          <Mic className="size-4" />
        </PromptInputButton>
        <PromptInputSubmit
          variant="ghost"
          status={status}
          disabled={!value.trim()}
          className="cursor-pointer rounded-full"
        />
      </PromptInputTools>
    </PromptInput>
  );
}
