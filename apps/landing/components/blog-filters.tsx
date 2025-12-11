"use client";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "changelog", label: "Changelog" },
  { value: "engineering", label: "Engineering" },
  { value: "product", label: "Product" },
  { value: "community", label: "Community" },
  { value: "guides", label: "Guides" },
] as const;

interface BlogFiltersProps {
  onFilterChange: (category: string) => void;
  activeFilter: string;
}

export function BlogFilters({ onFilterChange, activeFilter }: BlogFiltersProps) {
  return (
    <nav className="flex items-center gap-6 overflow-x-auto pb-2">
      {CATEGORIES.map((category) => (
        <button
          key={category.value}
          onClick={() => onFilterChange(category.value)}
          className={`whitespace-nowrap text-sm cursor-pointer transition-colors ${
            activeFilter === category.value
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {category.label}
        </button>
      ))}
    </nav>
  );
}
