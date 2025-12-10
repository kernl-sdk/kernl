"use client";

import { useEffect, useState } from "react";

const TRACK_HEIGHT_PERCENT = 0.3;

export function Scrollbar() {
  const [thumbPercent, setThumbPercent] = useState({ top: 0, height: 0 });

  useEffect(() => {
    const scrollArea = document.querySelector("[data-radix-scroll-area-viewport]");
    if (!scrollArea) return;

    const updateScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollArea;

      // Calculate thumb size as ratio of viewport to total content
      const thumbHeight = Math.max((clientHeight / scrollHeight) * 100, 10);

      // Calculate thumb position
      const scrollableHeight = scrollHeight - clientHeight;
      const scrollProgress = scrollableHeight > 0 ? scrollTop / scrollableHeight : 0;
      const thumbTop = scrollProgress * (100 - thumbHeight);

      setThumbPercent({ top: thumbTop, height: thumbHeight });
    };

    updateScroll();
    scrollArea.addEventListener("scroll", updateScroll);
    window.addEventListener("resize", updateScroll);

    return () => {
      scrollArea.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  }, []);

  return (
    <div
      className="fixed right-8 z-50 hidden w-0.5 md:flex"
      style={{
        top: `${(1 - TRACK_HEIGHT_PERCENT) / 2 * 100}%`,
        height: `${TRACK_HEIGHT_PERCENT * 100}%`,
      }}
    >
      {/* Track */}
      <div className="absolute inset-0 rounded-full bg-muted" />
      {/* Thumb */}
      <div
        className="absolute w-full rounded-full bg-steel transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        style={{
          top: `${thumbPercent.top}%`,
          height: `${thumbPercent.height}%`,
        }}
      />
    </div>
  );
}
