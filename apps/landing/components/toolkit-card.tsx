"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IconWrench, IconCheck } from "@/components/ui/icons";

interface ToolkitCardProps {
  name: string;
  title: string;
  icon?: string;
}

export function ToolkitCard({ name, title, icon }: ToolkitCardProps) {
  const [copied, setCopied] = useState(false);
  const command = `kernl add toolkit ${name}`;

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    toast(`Copied: ${command}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onClick={copy}
      className="flex flex-col items-center gap-6 rounded-3xl border border-transparent px-6 py-8 cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:border-brand/10"
    >
      <div className="flex size-11 items-center justify-center rounded-full ring-1 ring-brand/20">
        {copied ? (
          <IconCheck size={16} className="text-brand icon-animate" />
        ) : icon ? (
          <img src={icon} alt={title} className="size-5" />
        ) : (
          <IconWrench className="size-4 text-brand/60" />
        )}
      </div>
      <span className="text-[15px] font-medium text-foreground">{title}</span>
    </div>
  );
}
