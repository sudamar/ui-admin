'use client'

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppHeader } from "@/features/dashboard/components/app-header"

const AppSidebar = dynamic(
  async () => {
    const mod = await import("@/features/dashboard/components/app-sidebar")
    return { default: mod.AppSidebar }
  },
  {
    ssr: false,
    loading: () => (
      <aside
        className="hidden w-64 border-r border-border/60 bg-muted/50 md:flex"
        aria-hidden
      />
    ),
  }
)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Detectar se está em mobile (< 768px)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Determinar o defaultOpen baseado no estado mobile
  const defaultOpen = !isMobile

  return (
    <SidebarProvider defaultOpen={defaultOpen} key={String(isMounted)}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
