import { useRef, useState, useCallback, useEffect } from "react";

interface UseScrollToBottomOptions {
  threshold?: number /* threshold in pixels to consider "at bottom" */;
}

interface UseScrollToBottomReturn {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  isAtBottom: boolean;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export function useScrollToBottom(
  options: UseScrollToBottomOptions = {},
): UseScrollToBottomReturn {
  const { threshold = 10 } = options;
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkIsAtBottom = useCallback(() => {
    const e = scrollRef.current;
    if (!e) return true;
    return e.scrollHeight - e.scrollTop - e.clientHeight < threshold;
  }, [threshold]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const e = scrollRef.current;
    if (e) {
      e.scrollTo({ top: e.scrollHeight, behavior });
    }
  }, []);

  // update isAtBottom on scroll
  useEffect(() => {
    const e = scrollRef.current;
    if (!e) return;

    const handleScroll = () => {
      setIsAtBottom(checkIsAtBottom());
    };

    e.addEventListener("scroll", handleScroll, { passive: true });
    return () => e.removeEventListener("scroll", handleScroll);
  }, [checkIsAtBottom]);

  return { scrollRef, isAtBottom, scrollToBottom };
}
