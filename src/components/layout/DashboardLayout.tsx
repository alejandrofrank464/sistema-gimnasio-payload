'use client'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useData } from '../../lib/data-context'
import { Button } from '@/components/ui/button'

const ACTIVITY_REFRESH_THROTTLE_MS = 2 * 60 * 1000

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { settings } = useData()
  const router = useRouter()

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
          <div className="ml-auto">
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
