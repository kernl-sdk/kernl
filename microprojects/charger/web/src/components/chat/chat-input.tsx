"use client";

import { Mic, Plus } from "lucide-react";
import type { ChatStatus } from "ai";

/* components */
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
  PromptInputMessage,
  PromptInputAttachments,
  PromptInputAttachment,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (message: PromptInputMessage) => void;
  status: ChatStatus;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  status,
}: ChatInputProps) {
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    onSubmit(message);
  };

  return (
    <PromptInput
      onSubmit={handleSubmit}
      multiple
      globalDrop
      accept="image/*"
      className="relative"
    >
      <PromptInputAttachments>
        {(attachment) => <PromptInputAttachment data={attachment} />}
      </PromptInputAttachments>

      {/* left toolbar */}
      <PromptInputTools className="pl-2">
        <AttachButton />
      </PromptInputTools>

      {/* textarea */}
      <PromptInputTextarea
        value={value}
        placeholder="How can I help today?"
        onChange={(e) => onChange(e.currentTarget.value)}
        className="pl-4 pr-24"
      />

      {/* right toolbar */}
      <PromptInputTools className="absolute right-3 flex items-center gap-2">
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

function AttachButton() {
  const attachments = usePromptInputAttachments();

  return (
    <PromptInputButton
      className="cursor-pointer rounded-full"
      onClick={() => attachments.openFileDialog()}
    >
      <Plus className="size-4" />
    </PromptInputButton>
  );
}
