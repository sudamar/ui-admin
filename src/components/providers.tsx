'use client'

import { ThemeProvider } from "@/components/shared/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>{children}</AuthProvider>
      <Toaster
        toastOptions={{
          classNames: {
            toast: "border-2",
            success: "border-blue-500",
            error: "border-red-500",
            info: "border-yellow-500",
          },
        }}
      />
    </ThemeProvider>
  )
}
