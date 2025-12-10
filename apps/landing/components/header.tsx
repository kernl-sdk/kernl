"use client";

import { useState } from "react";
import { IconDiscord, IconGitHub } from "@/components/ui/icons";

const navLinks = [
  { href: "https://docs.kernl.sh", label: "docs" },
  { href: "#", label: "marketplace", disabled: true },
  { href: "https://www.dremnik.com/blog", label: "blog", external: true },
];

function MenuIcon({ size = 20 }: { size?: number }) {
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
      <line x1="4" y1="8" x2="20" y2="8" />
      <line x1="4" y1="16" x2="20" y2="16" />
    </svg>
  );
}

function CloseIcon({ size = 20 }: { size?: number }) {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Header bar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 bg-[oklch(0.18_0_0)] md:items-start md:px-12 md:py-10 md:bg-transparent">
        {/* Mobile: hamburger | Desktop: hidden */}
        <button
          onClick={() => setMenuOpen(true)}
          className="text-brand md:hidden"
          aria-label="Open menu"
        >
          <MenuIcon size={20} />
        </button>

        {/* Logo */}
        <span className="font-mono text-sm text-brand">kernl</span>

        {/* Social icons */}
        <div className="flex items-center gap-5">
          <a
            href="https://discord.gg/2gk86Jd3H9"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconDiscord size={16} />
          </a>
          <a
            href="https://github.com/kernl-sdk/kernl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground transition-colors hover:text-foreground"
          >
            <IconGitHub size={16} />
          </a>
        </div>
      </header>

      {/* Desktop nav sidebar */}
      <nav className="fixed left-12 top-20 z-50 hidden flex-col gap-3 md:flex">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.disabled ? undefined : link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            className={`w-fit bg-brand/[0.07] px-3 py-1.5 font-mono text-xs transition-opacity ${link.disabled ? "cursor-not-allowed text-brand/40" : "text-brand hover:opacity-70"}`}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile menu panel */}
      <div
        className={`fixed top-0 left-0 z-[70] h-full w-64 bg-background/95 backdrop-blur-md transform transition-transform duration-300 ease-out md:hidden ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="font-mono text-sm text-brand">kernl</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="text-brand"
            aria-label="Close menu"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-2 px-4 pt-4">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.disabled ? undefined : link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              onClick={() => !link.disabled && setMenuOpen(false)}
              className={`w-fit bg-brand/[0.07] px-3 py-2 font-mono text-sm transition-opacity ${link.disabled ? "cursor-not-allowed text-brand/40" : "text-brand hover:opacity-70"}`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Social links at bottom of mobile menu */}
        <div className="absolute bottom-0 left-0 flex items-center gap-5 px-4 pb-8">
          <a
            href="https://discord.gg/2gk86Jd3H9"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconDiscord size={20} />
          </a>
          <a
            href="https://github.com/kernl-sdk/kernl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground transition-colors hover:text-foreground"
          >
            <IconGitHub size={20} />
          </a>
        </div>
      </div>
    </>
  );
}
