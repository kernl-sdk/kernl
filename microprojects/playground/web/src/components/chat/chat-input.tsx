import { Mic, Plus } from "lucide-react";
import type { ChatStatus } from "ai";

import {
  PromptInput,
  PromptInputProvider,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
  PromptInputAttachment,
  useProviderAttachments,
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
    const hasText = Boolean(message.text?.trim());
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) return;
    onSubmit(message);
  };

  return (
    <PromptInputProvider>
      <div className="flex flex-col gap-2">
        {/* Attachments outside the pill */}
        <Attachments />

        {/* Input pill */}
        <PromptInput
          onSubmit={handleSubmit}
          multiple
          globalDrop
          accept="image/*"
          className="chat-input relative rounded-full border bg-surface py-[5px]"
        >
          {/* left toolbar */}
          <PromptInputTools className="pl-4">
            <AttachButton />
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
      </div>
    </PromptInputProvider>
  );
}

function Attachments() {
  const attachments = useProviderAttachments();

  if (!attachments.files.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-2">
      {attachments.files.map((file) => (
        <PromptInputAttachment key={file.id} data={file} />
      ))}
    </div>
  );
}

function AttachButton() {
  const attachments = useProviderAttachments();

  return (
    <PromptInputButton
      className="cursor-pointer rounded-full"
      onClick={() => attachments.openFileDialog()}
    >
      <Plus className="size-5" />
    </PromptInputButton>
  );
}
