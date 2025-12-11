"use client";

import { useRef, useState } from "react";
import { IconCopy, IconCheck } from "@/components/ui/icons";

export function InstallCommand() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const command = "pnpm i -g @kernl-sdk/cli";

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="relative mt-4"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="absolute -inset-px rounded-full transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, var(--color-steel) 0%, var(--color-brand) 25%, transparent 50%)`,
        }}
      />
      <button
        onClick={copy}
        className="relative flex cursor-pointer items-center gap-3 rounded-full border border-[#1f1f1f] bg-[#0c0c0c] px-6 py-3 font-mono text-sm"
      >
        <span className="text-brand">$</span>
        <span className="mr-1 text-steel">{command}</span>
        {copied ? (
          <IconCheck size={14} className="icon-animate text-steel" />
        ) : (
          <IconCopy size={14} className="icon-animate text-muted-foreground" />
        )}
      </button>
    </div>
  );
}
