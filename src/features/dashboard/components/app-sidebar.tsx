"use client"

import { useCallback, useState } from "react"
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
  Brush,
  Building,
  ChevronDown,
  Circle,
  FileText,
  FolderKanban,
  Home,
  Loader2,
  LogOut,
  Newspaper,
  RefreshCcw,
  Settings,
  Tag,
  User,
  UserRoundPen,
  UserStar,
  Users,
  type LucideIcon,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

import sidebarData from "@/data/layout/sidebar.json"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

type SidebarChildItem = {
  label: string
  icon: string
  iconColor?: string
  href: string
  show?: boolean
}

type SidebarItem = SidebarChildItem & {
  children?: SidebarChildItem[]
  action?: string
}

type SidebarGroup = {
  label: string
  items: SidebarItem[]
}

type SidebarConfig = {
  brand: {
    href: string
    abbr?: string
    title: string
    subtitle?: string
  }
  groups: SidebarGroup[]
}

const rawSidebarData: unknown = sidebarData
const sidebarConfig = rawSidebarData as SidebarConfig

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [revalidating, setRevalidating] = useState(false)

  const handleLogout = useCallback(async () => {
    await logout()
    router.replace("/login")
  }, [logout, router])

  const handleSidebarAction = useCallback(
    async (action?: string) => {
      if (action !== "revalidate") {
        return
      }

      if (revalidating) {
        return
      }

      setRevalidating(true)
      try {
        const response = await fetch("/revalidate", {
          method: "GET",
          cache: "no-store",
        })

        const payloadJson: unknown = await response.json().catch(() => null)
        const payload = payloadJson as {
          success?: boolean
          message?: string
        } | null

        if (!response.ok || payload?.success !== true) {
          throw new Error(payload?.message ?? "Não foi possível limpar o cache.")
        }

        toast.success("Cache atualizado com sucesso!")
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Não foi possível limpar o cache."
        toast.error(message)
      } finally {
        setRevalidating(false)
      }
    },
    [revalidating],
  )

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`)

  const iconMap: Record<string, LucideIcon> = {
    Home,
    FileText,
    FolderKanban,
    BarChart3,
    BookOpen,
    Brush,
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
              <Link href={sidebarConfig.brand.href} className="flex items-center gap-3">
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
                  <span className="font-semibold">{sidebarConfig.brand.title}</span>
                  <span className="text-xs">{sidebarConfig.brand.subtitle}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {sidebarConfig.groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items
                  .filter((item) => item.show !== false)
                  .map((item) => {
                    const Icon = iconMap[item.icon] ?? Circle
                    const childItems = Array.isArray(item.children)
                      ? item.children.filter((child) => child.show !== false)
                      : []
                    const isAction = typeof item.action === "string"
                    const isChildActive = !isAction && childItems.some((child) => isActive(child.href))
                    const active = !isAction && (isActive(item.href) || isChildActive)
                    const itemKey = item.href ?? item.label

                    return (
                      <SidebarMenuItem key={itemKey}>
                        {isAction ? (
                          <SidebarMenuButton
                            type="button"
                            onClick={() => {
                              void handleSidebarAction(item.action)
                            }}
                            disabled={item.action === "revalidate" && revalidating}
                            aria-busy={item.action === "revalidate" && revalidating}
                          >
                            <Icon className={cn("size-4", item.iconColor ?? "text-muted-foreground")} />
                            <span>
                              {item.action === "revalidate" && revalidating ? "Limpando cache..." : item.label}
                            </span>
                            {item.action === "revalidate" && revalidating ? (
                              <Loader2 className="ml-auto size-4 animate-spin text-muted-foreground" />
                            ) : null}
                          </SidebarMenuButton>
                        ) : (
                          <SidebarMenuButton asChild isActive={active}>
                            <Link href={item.href} data-sidebar-link>
                              <Icon className={cn("size-4", item.iconColor ?? "text-muted-foreground")} />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        )}
                        {!isAction && childItems.length > 0 ? (
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
