'use client'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  DashboardSquare03Icon,
  UserMultiple02Icon,
  CreditCardAddIcon,
  Calendar02Icon,
  Configuration01Icon,
  File02Icon,
  Dumbbell02Icon,
} from '@hugeicons/core-free-icons'
import { NavLink } from '@/components/nav-link'
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
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'Dashboard', url: '/home', icon: DashboardSquare03Icon },
  { title: 'Clientes', url: '/clientes', icon: UserMultiple02Icon },
  { title: 'Pagos', url: '/pagos', icon: CreditCardAddIcon },
  { title: 'Horario', url: '/horario', icon: Calendar02Icon },
  { title: 'Ajustes', url: '/ajustes', icon: Configuration01Icon },
  { title: 'Logs', url: '/logs', icon: File02Icon },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === 'collapsed'
  const pathname = usePathname() ?? ''

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-border border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Dumbbell02Icon}
            className="h-5 w-5 shrink-0"
            color="var(--primary)"
          />
          {!collapsed && <span className="text-foreground text-xl font-bold">GymOS</span>}
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
                      className="hover:bg-accent text-foreground font-regular h-12 rounded-md px-3 text-lg"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      {/* <item.icon className="h-4 w-4 shrink-0" /> */}
                      <HugeiconsIcon icon={item.icon} className="h-5 w-5 shrink-0" />
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
