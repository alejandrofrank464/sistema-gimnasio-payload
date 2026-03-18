'use client'

import { AppSidebar } from '@/components/layout/AppSidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useData } from '../../lib/data-context'

const ACTIVITY_REFRESH_THROTTLE_MS = 2 * 60 * 1000

const getEmailHandle = (email: string | null): string => {
  if (!email) return 'usuario'

  const beforeAt = email.split('@')[0]?.trim()
  if (!beforeAt) return 'usuario'

  return beforeAt
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { settings } = useData()
  const router = useRouter()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    let lastActivityRefreshAt = 0

    const refreshOnActivity = async () => {
      const now = Date.now()
      if (now - lastActivityRefreshAt < ACTIVITY_REFRESH_THROTTLE_MS) {
        return
      }

      const response = await fetch('/api/users/refresh-token', {
        method: 'POST',
        credentials: 'include',
      }).catch(() => null)

      if (response?.ok) {
        lastActivityRefreshAt = now
        return
      }

      if (response?.status === 401) {
        router.replace('/')
      }
    }

    const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'scroll']
    for (const eventName of activityEvents) {
      window.addEventListener(eventName, refreshOnActivity, { passive: true })
    }

    return () => {
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, refreshOnActivity)
      }
    }
  }, [router])

  useEffect(() => {
    let isMounted = true

    const loadCurrentUser = async () => {
      const response = await fetch('/api/users/me', {
        method: 'GET',
        credentials: 'include',
      }).catch(() => null)

      if (!response?.ok || !isMounted) {
        return
      }

      const payload = (await response.json().catch(() => null)) as {
        user?: { email?: string | null } | null
      } | null

      const email = payload?.user?.email
      if (typeof email === 'string' && isMounted) {
        setUserEmail(email)
      }
    }

    void loadCurrentUser()

    return () => {
      isMounted = false
    }
  }, [])

  const userHandle = useMemo(() => getEmailHandle(userEmail), [userEmail])
  const avatarInitial = useMemo(() => userHandle.charAt(0).toUpperCase(), [userHandle])

  const handleLogout = async () => {
    await fetch('/api/users/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => null)

    router.replace('/')
    router.refresh()
  }

  return (
    <SidebarProvider defaultOpen className="min-h-svh w-full">
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="border-border bg-card flex h-12 shrink-0 items-center border-b px-4">
          <SidebarTrigger className="mr-3" />
          <span className="text-foreground truncate text-lg font-semibold">
            {settings.nombreGimnasio}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>{avatarInitial}</AvatarFallback>
              </Avatar>
              <Badge variant="outline" className="text-xs">
                {userHandle}
              </Badge>
            </div>
            <Button variant="ghost" size="lg" onClick={handleLogout} className="text-sm">
              Salir
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
