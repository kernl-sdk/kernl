"use client";

import { useState } from "react";

import { IconSearch } from "@/components/ui/icons";
import { ToolkitCard } from "@/components/toolkit-card";

interface Toolkit {
  name: string;
  type: string;
  title: string;
  description: string;
  icon?: string;
  category?: string;
}

interface MarketplaceSearchProps {
  toolkits: Toolkit[];
}

export function MarketplaceSearch({ toolkits }: MarketplaceSearchProps) {
  const [query, setQuery] = useState("");

  const filtered = toolkits
    .filter(
      (t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.description.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <>
      <div className="relative mt-10 w-full max-w-2xl">
        <IconSearch
          size={16}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-full bg-surface py-3.5 pl-14 pr-8 text-[15px] text-foreground caret-steel focus:outline-none"
        />
      </div>
      <div className="mt-12 grid w-full max-w-2xl grid-cols-4 gap-2">
        {filtered.map((toolkit) => (
          <ToolkitCard
            key={toolkit.name}
            name={toolkit.name}
            title={toolkit.title}
            icon={toolkit.icon}
          />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="mt-8 text-sm text-muted">No toolkits found.</p>
      )}
    </>
  );
}
