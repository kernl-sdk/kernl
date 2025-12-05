import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ChevronRight } from "lucide-react";
import { kernl, type Thread } from "@/lib/kernl";

interface HistorySidebarProps {
  agentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TimeGroup = "Today" | "Yesterday" | "This Week" | "This Month" | "Older";

function getTimeGroup(date: Date): TimeGroup {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= weekAgo) return "This Week";
  if (date >= monthAgo) return "This Month";
  return "Older";
}

interface GroupedThread {
  tid: string;
  title: string;
  updatedAt: Date;
}

function groupThreadsByTime(
  threads: GroupedThread[],
): Map<TimeGroup, GroupedThread[]> {
  const groups = new Map<TimeGroup, GroupedThread[]>();
  const order: TimeGroup[] = [
    "Today",
    "Yesterday",
    "This Week",
    "This Month",
    "Older",
  ];

  for (const group of order) {
    groups.set(group, []);
  }

  for (const thread of threads) {
    const group = getTimeGroup(thread.updatedAt);
    groups.get(group)?.push(thread);
  }

  return groups;
}

export function HistorySidebar({
  agentId,
  open,
  onOpenChange,
}: HistorySidebarProps) {
  const navigate = useNavigate();

  const { data, isLoading } = useSWR(open ? ["threads", agentId] : null, () =>
    kernl.threads.list({ agentId, limit: 50 }),
  );

  const threads: GroupedThread[] = (data?.threads ?? []).map((t: Thread) => ({
    tid: t.tid,
    title: t.title ?? "New conversation",
    updatedAt: new Date(t.updatedAt),
  }));

  const handleSelectThread = (threadId: string) => {
    navigate(`/agents/${agentId}/c/${threadId}`);
    onOpenChange(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const groupedThreads = groupThreadsByTime(threads);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex h-full w-160 flex-col" showClose={false}>
        <div className="relative flex shrink-0 items-center justify-center gap-3 py-8">
          <button
            onClick={() => onOpenChange(false)}
            className="group/close absolute left-8 flex cursor-pointer items-center text-brand outline-none focus:ring-0 focus-visible:ring-0"
          >
            <ChevronRight className="size-4 transition-transform duration-200 group-hover/close:translate-x-[3px]" />
            <ChevronRight className="-ml-2.5 size-4 transition-transform duration-200 group-hover/close:translate-x-[5px]" />
          </button>
          <History className="size-5" />
          <span className="text-lg font-semibold">History</span>
        </div>

        <ScrollArea className="h-[calc(100vh-120px)] px-8">
          <div className="space-y-12 py-4">
            {isLoading ? (
              <p className="text-center text-sm text-muted-foreground">
                Loading...
              </p>
            ) : threads.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No conversations yet
              </p>
            ) : (
              <>
                {Array.from(groupedThreads.entries()).map(
                  ([group, groupThreads]) =>
                    groupThreads.length > 0 && (
                      <div key={group}>
                        <p className="mb-4 pl-[22px] text-xs text-muted">
                          {group}
                        </p>
                        <div className="space-y-6">
                          {groupThreads.map((thread) => (
                            <button
                              key={thread.tid}
                              onClick={() => handleSelectThread(thread.tid)}
                              className="group flex w-full cursor-pointer items-center gap-2 text-left"
                            >
                              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                              <div className="flex flex-1 items-start justify-between pr-2 transition-transform duration-200 group-hover:translate-x-2">
                                <p className="min-w-0 flex-1 text-sm text-foreground">
                                  {thread.title}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(thread.updatedAt)}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ),
                )}
                <p className="py-8 text-center text-xs text-muted">
                  End of history
                </p>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
