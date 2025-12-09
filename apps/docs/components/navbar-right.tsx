'use client'

import { IconDiscord, IconGitHub } from '@/components/ui/icons'

export function NavbarRight() {
  return (
    <div className="navbar-right">
      <a
        href="https://discord.gg/2gk86Jd3H9"
        target="_blank"
        rel="noopener noreferrer"
        className="navbar-icon-link"
        title="Join our Discord"
      >
        <IconDiscord size={16} />
      </a>
      <a
        href="https://github.com/kernl-sdk/kernl"
        target="_blank"
        rel="noopener noreferrer"
        className="navbar-icon-link navbar-icon-github"
        title="GitHub"
      >
        <IconGitHub size={16} />
      </a>
    </div>
  )
}
