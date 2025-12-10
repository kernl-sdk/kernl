"use client";

import { useState } from "react";
import { IconCopy, IconCheck } from "@/components/ui/icons";

export function InstallCommand() {
  const [copied, setCopied] = useState(false);
  const command = "pnpm i -g @kernl-sdk/cli";

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="mt-4 flex cursor-pointer items-center gap-3 rounded-full border border-[#1f1f1f] bg-[#0c0c0c] px-6 py-3 font-mono text-sm transition-colors hover:border-steel"
    >
      <span className="text-brand">$</span>
      <span className="mr-1 text-steel">{command}</span>
      {copied ? (
        <IconCheck size={14} className="icon-animate text-steel" />
      ) : (
        <IconCopy size={14} className="icon-animate text-muted-foreground" />
      )}
    </button>
  );
}
