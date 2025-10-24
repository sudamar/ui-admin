'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from '@/types/user'

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  updateUser: (data: Partial<User>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simula carregamento do usuário logado
    // Em produção, isso viria de um token JWT ou session
    const mockLoggedUser: User = {
      id: 1,
      name: "João Silva",
      email: "joao.silva@fafih.com",
      role: "Admin",
      status: "active",
      createdAt: "2024-01-15",
      avatar: "/avatar.png"
    }

    setTimeout(() => {
      setUser(mockLoggedUser)
      setIsLoading(false)
    }, 300)
  }, [])

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data })
    }
  }

  return (
    <AuthContext.Provider value={{ user, setUser, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
