"use client";

import { useEffect, useRef, useState } from "react";
import { IconKernl } from "@/components/ui/icons";
import { BlogFilters } from "./blog-filters";

interface BlogHeaderProps {
  onFilterChange: (category: string) => void;
  activeFilter: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function BlogHeader({
  onFilterChange,
  activeFilter,
  searchQuery,
  onSearchChange,
}: BlogHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape" && isOpen) {
        onSearchChange("");
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onSearchChange]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        onSearchChange("");
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onSearchChange]);

  return (
    <>
      {/* Search bar - slides down from top */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 ease-out ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div ref={searchBarRef} className="mt-8 w-full max-w-md px-4">
          <div className="flex items-center gap-3 rounded-full border border-[#1f1f1f] bg-[#0c0c0c] px-4 py-3 shadow-lg shadow-black/20">
            <SearchIcon size={14} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button
              onClick={() => {
                onSearchChange("");
                setIsOpen(false);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              esc
            </button>
          </div>
        </div>
      </div>

      {/* Header content */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <IconKernl size={28} className="text-steel mb-6" />
          <h1 className="text-2xl font-semibold text-foreground">Blog</h1>
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <BlogFilters onFilterChange={onFilterChange} activeFilter={activeFilter} />
          <button
            onClick={() => setIsOpen(true)}
            className="hidden md:block text-foreground hover:text-brand transition-colors cursor-pointer"
          >
            <SearchIcon size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
