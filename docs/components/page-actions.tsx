'use client'

import { useCopy } from 'nextra/hooks'
import { IconCopy, IconCheck, IconShare } from '@/components/ui/icons'

type PageActionsProps = {
  sourceCode: string
}

export function PageActions({ sourceCode }: PageActionsProps) {
  const { copy: copyContent, isCopied: contentCopied } = useCopy()
  const { copy: copyLink, isCopied: linkCopied } = useCopy()

  return (
    <div className="page-header-row">
      <button
        onClick={() => copyContent(sourceCode)}
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
        onClick={() => copyLink(window.location.href)}
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
  )
}
