'use client'

import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useData } from '../../lib/data-context'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { settings } = useData()
  const router = useRouter()

  useEffect(() => {
    if (!window.sessionStorage.getItem('gym_token')) {
      router.replace('/')
    }
  }, [router])

  const handleLogout = () => {
    window.sessionStorage.removeItem('gym_token')
    window.sessionStorage.removeItem('gym_user')
    router.replace('/')
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
            <Button variant="ghost" size="lg" onClick={handleLogout}>
              Salir
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
