'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { forwardRef } from 'react'

import { cn } from '@/lib/utils'

interface NavLinkCompatProps extends Omit<React.ComponentProps<typeof Link>, 'href' | 'className'> {
  className?: string
  activeClassName?: string
  pendingClassName?: string
  to: string
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName: _pendingClassName, to, ...props }, ref) => {
    const pathname = usePathname() ?? ''
    const isActive = pathname.startsWith(to)

    return (
      <Link ref={ref} href={to} className={cn(className, isActive && activeClassName)} {...props} />
    )
  },
)

NavLink.displayName = 'NavLink'

export { NavLink }
