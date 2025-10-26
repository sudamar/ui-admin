'use client'

import { createContext, useContext, useEffect, useState } from "react"

type AuthUser = {
  name: string
  email: string
  avatarUrl?: string
  role: "admin" | "viewer"
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchProfile(): Promise<AuthUser | null> {
  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    })
    if (!response.ok) {
      return null
    }
    const result = (await response.json()) as {
      success: boolean
      user?: AuthUser
    }
    if (!result.success || !result.user) {
      return null
    }
    return result.user
  } catch (error) {
    console.error("Erro ao buscar perfil:", error)
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async () => {
    setLoading(true)
    const profile = await fetchProfile()
    setUser(profile)
    setLoading(false)
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refresh: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider")
  }

  return context
}
