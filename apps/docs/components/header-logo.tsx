'use client'

import Link from 'next/link'
import { IconKernl } from '@/components/ui/icons'

export function HeaderLogo() {
  return (
    <div className="header-center-logo">
      <Link href="https://www.kernl.sh" className="pointer-events-auto">
        <IconKernl size={28} className="header-logo-icon" />
      </Link>
    </div>
  )
}
