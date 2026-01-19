'use client';

import { useState } from 'react';

function IconCheck({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path
        d="M13.5 4.5L6 12L2.5 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCopy({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} strokeLinejoin="round" viewBox="0 0 16 16" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.75 0.5C1.7835 0.5 1 1.2835 1 2.25V9.75C1 10.7165 1.7835 11.5 2.75 11.5H3.75H4.5V10H3.75H2.75C2.61193 10 2.5 9.88807 2.5 9.75V2.25C2.5 2.11193 2.61193 2 2.75 2H8.25C8.38807 2 8.5 2.11193 8.5 2.25V3H10V2.25C10 1.2835 9.2165 0.5 8.25 0.5H2.75ZM7.75 4.5C6.7835 4.5 6 5.2835 6 6.25V13.75C6 14.7165 6.7835 15.5 7.75 15.5H13.25C14.2165 15.5 15 14.7165 15 13.75V6.25C15 5.2835 14.2165 4.5 13.25 4.5H7.75ZM7.5 6.25C7.5 6.11193 7.61193 6 7.75 6H13.25C13.3881 6 13.5 6.11193 13.5 6.25V13.75C13.5 13.8881 13.3881 14 13.25 14H7.75C7.61193 14 7.5 13.8881 7.5 13.75V6.25Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconShare({ className, size = 14 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} strokeLinejoin="round" viewBox="0 0 16 16" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.29289 1.39644C7.68342 1.00592 8.31658 1.00592 8.70711 1.39644L11.7803 4.46966L12.3107 4.99999L11.25 6.06065L10.7197 5.53032L8.75 3.56065V10.25V11H7.25V10.25V3.56065L5.28033 5.53032L4.75 6.06065L3.68934 4.99999L4.21967 4.46966L7.29289 1.39644ZM13.5 9.24999V13.5H2.5V9.24999V8.49999H1V9.24999V14C1 14.5523 1.44771 15 2 15H14C14.5523 15 15 14.5523 15 14V9.24999V8.49999H13.5V9.24999Z"
        fill="currentColor"
      />
    </svg>
  );
}

const cache = new Map<string, string>();

export function PageActions({ markdownUrl }: { markdownUrl: string }) {
  const [contentCopied, setContentCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const copyContent = async () => {
    const cached = cache.get(markdownUrl);
    if (cached) {
      await navigator.clipboard.writeText(cached);
      setContentCopied(true);
      setTimeout(() => setContentCopied(false), 2000);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(markdownUrl);
      const content = await res.text();
      cache.set(markdownUrl, content);
      await navigator.clipboard.writeText(content);
      setContentCopied(true);
      setTimeout(() => setContentCopied(false), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="page-header-row">
      <button
        onClick={copyContent}
        disabled={isLoading}
        className="page-action-btn"
        title="Copy as Markdown"
        aria-label="Copy as Markdown"
      >
        {contentCopied ? (
          <IconCheck className="page-action-icon page-action-icon-brand" />
        ) : (
          <IconCopy className="page-action-icon page-action-icon-brand" />
        )}
      </button>
      <button
        onClick={copyLink}
        className="page-action-btn"
        title="Copy link"
        aria-label="Copy link"
      >
        {linkCopied ? (
          <IconCheck className="page-action-icon page-action-icon-steel" />
        ) : (
          <IconShare className="page-action-icon page-action-icon-steel" />
        )}
      </button>
    </div>
  );
}
