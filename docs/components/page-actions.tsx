'use client'

import { usePathname } from 'next/navigation'
import { useState, useCallback } from 'react'
import { IconCopy, IconCheck, IconShare } from '@/components/ui/icons'

export function PageActions() {
  const pathname = usePathname()
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  const handleCopy = useCallback(async () => {
    const path = pathname === '/' ? 'index' : pathname.slice(1)

    try {
      const res = await fetch(`/api/content/${path}`)
      if (!res.ok) throw new Error('Failed to fetch')

      const content = await res.text()
      await navigator.clipboard.writeText(content)

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [pathname])

  const handleShare = useCallback(async () => {
    const url = window.location.href

    try {
      await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch (err) {
      console.error('Failed to share:', err)
    }
  }, [])

  return (
    <div className="page-header-row">
      <button
        onClick={handleCopy}
        className="page-action-btn"
        title="Copy as Markdown"
        aria-label="Copy as Markdown"
      >
        {copied ? (
          <IconCheck className="page-action-icon page-action-icon-brand" />
        ) : (
          <IconCopy className="page-action-icon page-action-icon-brand" />
        )}
      </button>
      <button
        onClick={handleShare}
        className="page-action-btn"
        title="Copy link"
        aria-label="Copy link"
      >
        {shared ? (
          <IconCheck className="page-action-icon page-action-icon-steel" />
        ) : (
          <IconShare className="page-action-icon page-action-icon-steel" />
        )}
      </button>
    </div>
  )
}
