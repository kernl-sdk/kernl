import { Link, Outlet, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
// import { Store } from "lucide-react";

import { cn } from "@/lib/utils";

import { IconAgents, IconWrench, IconLeaf } from "@/components/ui/icons";

const navItems = [
  { href: "/agents", label: "Agents", icon: IconAgents },
  { href: "/toolkits", label: "Toolkits", icon: IconWrench },
  // { href: "/marketplace", label: "Marketplace", icon: Store },
];

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="relative h-screen">
      {/* Sidebar */}
      <aside className="group fixed left-0 top-0 z-10 flex h-full w-28 flex-col px-6 py-6 transition-all duration-300 hover:w-56">
        {/* Logo */}
        <div className="mb-8">
          <span className="text-sm font-mono font-light text-brand">
            playground
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 pl-0 transition-all duration-300 group-hover:pl-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 py-2 text-sm transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="translate-x-[-8px] opacity-0 blur-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-hover:blur-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="mt-auto pl-0 transition-all duration-300 group-hover:pl-2">
          <a
            href="https://docs.kernl.sh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <IconLeaf className="size-4 shrink-0 text-brand" />
            <span className="translate-x-[-8px] opacity-0 blur-sm transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-hover:blur-none">
              Documentation
            </span>
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="h-full overflow-hidden">
        <Outlet />
      </main>

      <Toaster theme="dark" position="bottom-right" />
    </div>
  );
}
