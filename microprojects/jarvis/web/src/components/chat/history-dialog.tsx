"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { History, MessageSquare, X, Search } from "lucide-react";
import useSWRInfinite from "swr/infinite";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  kernl,
  type ThreadResource,
  type ListThreadsParams,
} from "@/lib/kernl";

const LIMIT = 50;

interface ThreadHistoryProps {
  currentThreadId?: string;
  agentId?: string;
}

interface GroupedThreads {
  [key: string]: ThreadResource[];
}

const fetcher = async (
  params: ListThreadsParams,
): Promise<ThreadResource[]> => {
  return kernl.threads.list(params);
};

const gettimegroup = (dateString: string | null): string => {
  if (!dateString) {
    return "Recent";
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return "Recent";
  }

  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays <= 7) {
    return "Previous 7 Days";
  } else if (diffDays <= 30) {
    return "Previous 30 Days";
  } else {
    return "Older";
  }
};

const getthreadtitle = (thread: ThreadResource): string => {
  // Use thread title if available, otherwise fall back to agent name
  if (thread.title) {
    return thread.title;
  }
  return `Chat with ${thread.agentId}`;
};

export function ThreadHistory({
  currentThreadId,
  agentId,
}: ThreadHistoryProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getkey = (
    pageIndex: number,
    previousPageData: ThreadResource[] | null,
  ): ListThreadsParams | null => {
    if (previousPageData && previousPageData.length < LIMIT) return null;

    return {
      limit: LIMIT,
      offset: pageIndex * LIMIT,
      agentId,
    };
  };

  const { data, error, size, setSize, isLoading, isValidating } =
    useSWRInfinite(getkey, fetcher, {
      revalidateFirstPage: false,
      revalidateOnFocus: false,
    });

  const threads = data ? data.flat() : [];
  const hasMore = data && data[data.length - 1]?.length === LIMIT;

  const filteredandgroupedthreads = useMemo(() => {
    const filtered = threads.filter((thread) => {
      const title = getthreadtitle(thread).toLowerCase();
      return title.includes(searchQuery.toLowerCase());
    });

    const grouped: GroupedThreads = {};
    filtered.forEach((thread) => {
      const group = gettimegroup(thread.createdAt);
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(thread);
    });

    return grouped;
  }, [threads, searchQuery]);

  const handleThreadClick = (tid: string) => {
    setOpen(false);
    router.push(`/chat/${tid}`);
  };

  const handleLoadMore = () => {
    setSize(size + 1);
  };

  const groupOrder = [
    "Today",
    "Yesterday",
    "Previous 7 Days",
    "Previous 30 Days",
    "Older",
    "Recent",
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="cursor-pointer rounded-full"
        >
          <History className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogTitle className="sr-only">Chat History</DialogTitle>
        {/* Search header */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[500px]">
          {error && (
            <div className="text-sm text-destructive p-4 text-center">
              {error.message}
            </div>
          )}

          {!error && threads.length === 0 && !isLoading && (
            <div className="text-sm text-muted-foreground p-4 text-center">
              No chat history yet
            </div>
          )}

          {!error &&
            threads.length > 0 &&
            Object.keys(filteredandgroupedthreads).length === 0 && (
              <div className="text-sm text-muted-foreground p-4 text-center">
                No chats match your search
              </div>
            )}

          <div className="px-4 py-2">
            {groupOrder.map((groupName) => {
              const groupThreads = filteredandgroupedthreads[groupName];
              if (!groupThreads || groupThreads.length === 0) return null;

              return (
                <div key={groupName} className="mb-6">
                  <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                    {groupName}
                  </h3>
                  <div className="space-y-1">
                    {groupThreads.map((thread) => {
                      const isActive = thread.tid === currentThreadId;

                      return (
                        <Button
                          key={thread.tid}
                          variant="ghost"
                          onClick={() => handleThreadClick(thread.tid)}
                          className={`w-full justify-start px-3 py-2.5 h-auto rounded-lg flex items-center gap-3 ${
                            isActive ? "bg-accent" : ""
                          }`}
                        >
                          <MessageSquare className="size-4 flex-shrink-0 text-muted-foreground" />
                          <span className="text-sm truncate">
                            {getthreadtitle(thread)}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {isLoading && (
            <div className="text-sm text-muted-foreground p-4 text-center">
              Loading...
            </div>
          )}

          {!isLoading && hasMore && threads.length > 0 && (
            <div className="pb-4 px-4 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadMore}
                disabled={isValidating}
                className="w-full"
              >
                {isValidating ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
