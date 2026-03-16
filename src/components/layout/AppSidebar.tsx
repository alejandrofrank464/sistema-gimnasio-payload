'use client'

import { Users, CreditCard, Calendar, Settings, FileText, Dumbbell } from 'lucide-react'
import { NavLink } from '@/components/NavLink'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarRail,
  useSidebar,
  SidebarProvider,
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'Clientes', url: '/clientes', icon: Users },
  { title: 'Pagos', url: '/pagos', icon: CreditCard },
  { title: 'Horario', url: '/horario', icon: Calendar },
  { title: 'Ajustes', url: '/ajustes', icon: Settings },
  { title: 'Logs', url: '/logs', icon: FileText },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  const pathname = usePathname() ?? ''

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-border border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-primary h-5 w-5 shrink-0" />
          {!collapsed && <span className="text-foreground text-sm font-bold">GymOS</span>}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname.startsWith(item.url)}>
                    <NavLink
                      to={item.url}
                      className="hover:bg-accent"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="ml-2">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
