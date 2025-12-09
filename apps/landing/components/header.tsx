import { IconDiscord, IconGitHub } from "@/components/ui/icons";

const navLinks = [
  { href: "https://docs.kernl.sh", label: "docs" },
  { href: "#", label: "marketplace", disabled: true },
  { href: "https://www.dremnik.com/blog", label: "blog", external: true },
];

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-start justify-between px-12 py-10">
      <div className="flex flex-col gap-12">
        <span className="font-mono text-sm text-brand">kernl</span>
        <nav className="flex flex-col gap-3">
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
      </div>
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
  );
}
