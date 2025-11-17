"use client"

import { useCallback } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  BarChart3,
  Bell,
  BookOpen,
  Building,
  ChevronDown,
  Circle,
  FileText,
  FolderKanban,
  Home,
  Newspaper,
  RefreshCcw,
  LogOut,
  Settings,
  Tag,
  User,
  Users,
  type LucideIcon,
  UserStar,
  UserRoundPen,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

import sidebarData from "@/data/layout/sidebar.json"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = useCallback(async () => {
    await logout()
    router.replace("/login")
  }, [logout, router])

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`)

  const iconMap: Record<string, LucideIcon> = {
    Home,
    FileText,
    FolderKanban,
    BarChart3,
    BookOpen,
    Building,
    Users,
    Newspaper,
    RefreshCcw,
    Bell,
    UserStar,
    UserRoundPen,
    User,
    LogOut,
    Settings,
    Tag,
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={sidebarData.brand.href} className="flex items-center gap-3">
                <div className="relative h-15 w-15 overflow-hidden rounded-lg border border-border/60 bg-background shadow-sm">
                  <Image
                    src="/logo-fafih-quadrado-sem-fundo.png"
                    alt="Logotipo FAFIH"
                    fill
                    sizes="80px"
                    className="object-contain p-1.5"
                    priority
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">{sidebarData.brand.title}</span>
                  <span className="text-xs">{sidebarData.brand.subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {sidebarData.groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.filter((item) => item.show !== false).map((item) => {
                  const Icon = iconMap[item.icon] ?? Circle
                  const childItems = Array.isArray(item.children)
                    ? item.children.filter((child) => child.show !== false)
                    : []
                  const isChildActive = childItems.some((child) => isActive(child.href))
                  const active = isActive(item.href) || isChildActive
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link href={item.href} data-sidebar-link>
                          <Icon className={cn("size-4", item.iconColor ?? "text-muted-foreground")} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {childItems.length > 0 ? (
                        <SidebarMenuSub>
                          {childItems.map((child) => {
                            const ChildIcon = iconMap[child.icon] ?? Circle
                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton asChild isActive={isActive(child.href)}>
                                  <Link href={child.href} data-sidebar-link>
                                    <ChildIcon
                                      className={cn("size-4", child.iconColor ?? "text-muted-foreground")}
                                    />
                                    <span>{child.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          })}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <Avatar className="size-8">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                      {user?.name
                        ?.split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() ?? "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">
                      {user?.name ?? "Usuário"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email ?? "sem email"}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4 text-blue-500" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4 text-gray-500" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault()
                    void handleLogout()
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4 text-red-500" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
