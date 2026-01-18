"use client";

import { useTheme } from "next-themes";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { useState, useEffect } from "react";

type DiffViewerProps = {
  before: string;
  after: string;
  filename?: string;
  splitView?: boolean;
};

const styles = {
  variables: {
    dark: {
      diffViewerBackground: "transparent",
      diffViewerColor: "var(--foreground)",
      addedBackground: "rgba(46, 160, 67, 0.15)",
      addedColor: "var(--foreground)",
      removedBackground: "rgba(248, 81, 73, 0.15)",
      removedColor: "var(--foreground)",
      wordAddedBackground: "rgba(46, 160, 67, 0.4)",
      wordRemovedBackground: "rgba(248, 81, 73, 0.4)",
      addedGutterBackground: "rgba(46, 160, 67, 0.2)",
      removedGutterBackground: "rgba(248, 81, 73, 0.2)",
      gutterBackground: "transparent",
      gutterBackgroundDark: "transparent",
      highlightBackground: "rgba(255, 255, 255, 0.1)",
      highlightGutterBackground: "rgba(255, 255, 255, 0.1)",
      codeFoldGutterBackground: "transparent",
      codeFoldBackground: "transparent",
      emptyLineBackground: "transparent",
      gutterColor: "var(--muted-foreground)",
      addedGutterColor: "var(--foreground)",
      removedGutterColor: "var(--foreground)",
      codeFoldContentColor: "var(--muted-foreground)",
    },
    light: {
      diffViewerBackground: "transparent",
      diffViewerColor: "var(--foreground)",
      addedBackground: "rgba(46, 160, 67, 0.1)",
      addedColor: "var(--foreground)",
      removedBackground: "rgba(248, 81, 73, 0.1)",
      removedColor: "var(--foreground)",
      wordAddedBackground: "rgba(46, 160, 67, 0.3)",
      wordRemovedBackground: "rgba(248, 81, 73, 0.3)",
      addedGutterBackground: "rgba(46, 160, 67, 0.15)",
      removedGutterBackground: "rgba(248, 81, 73, 0.15)",
      gutterBackground: "transparent",
      gutterBackgroundDark: "transparent",
      highlightBackground: "rgba(0, 0, 0, 0.05)",
      highlightGutterBackground: "rgba(0, 0, 0, 0.05)",
      codeFoldGutterBackground: "transparent",
      codeFoldBackground: "transparent",
      emptyLineBackground: "transparent",
      gutterColor: "var(--muted-foreground)",
      addedGutterColor: "var(--foreground)",
      removedGutterColor: "var(--foreground)",
      codeFoldContentColor: "var(--muted-foreground)",
    },
  },
  line: {
    padding: "2px 8px",
    fontSize: "13px",
    fontFamily: "var(--font-mono, monospace)",
  },
  gutter: {
    padding: "0 8px",
    minWidth: "40px",
    fontSize: "12px",
  },
  contentText: {
    fontFamily: "var(--font-mono, monospace)",
    fontSize: "13px",
  },
};

export function DiffViewer({
  before,
  after,
  splitView = false,
}: DiffViewerProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="p-4 text-sm text-muted-foreground font-mono whitespace-pre-wrap">
        {before || after}
      </div>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div className="overflow-x-auto text-sm [&_pre]:!bg-transparent [&_td]:!border-0">
      <ReactDiffViewer
        oldValue={before}
        newValue={after}
        splitView={splitView}
        useDarkTheme={isDark}
        compareMethod={DiffMethod.WORDS}
        styles={styles}
        hideLineNumbers={false}
      />
    </div>
  );
}
