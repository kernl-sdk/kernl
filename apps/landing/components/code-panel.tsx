"use client";

import { useRef, useState } from "react";

interface CodePanelProps {
  html: string;
}

export function CodePanel({ html }: CodePanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Mouse-responsive sheen */}
      <div
        className="absolute -inset-px rounded-xl transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, var(--color-steel) 0%, var(--color-brand) 25%, transparent 50%)`,
        }}
      />

      {/* Main panel */}
      <div className="relative overflow-hidden rounded-xl border border-border/50 bg-surface">
        <div
          className="overflow-x-auto p-4 font-mono text-[12px] leading-6 [&_pre]:!bg-transparent [&_code]:!bg-transparent [&_.line-number]:mr-4 [&_.line-number]:inline-block [&_.line-number]:w-4 [&_.line-number]:select-none [&_.line-number]:text-right [&_.line-number]:font-mono"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
