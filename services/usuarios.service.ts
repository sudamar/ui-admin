import type { User, CreateUserInput, UpdateUserInput } from "@/types/Usuario"
import usuariosData from "@/data/usuarios.json"

// Clonar dados para evitar mutação direta do JSON importado
let mockUsers: User[] = [...usuariosData as User[]]

export const usersService = {
  // Listar todos os usuários
  getAll: async (): Promise<User[]> => {
    // Simula delay de API
    await new Promise(resolve => setTimeout(resolve, 300))
    return mockUsers
  },

  // Buscar usuário por ID
  getById: async (id: number): Promise<User | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 200))
    return mockUsers.find(user => user.id === id)
  },

  // Criar novo usuário
  create: async (user: CreateUserInput): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    const newUser: User = {
      ...user,
      id: Math.max(...mockUsers.map(u => u.id)) + 1,
      createdAt: new Date().toISOString().split('T')[0]
    }
    mockUsers.push(newUser)
    return newUser
  },

  // Atualizar usuário
  update: async (id: number, data: UpdateUserInput): Promise<User | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 500))
    const index = mockUsers.findIndex(user => user.id === id)
    if (index === -1) return undefined

    mockUsers[index] = { ...mockUsers[index], ...data }
    return mockUsers[index]
  },

  // Deletar usuário
  delete: async (id: number): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300))
    const index = mockUsers.findIndex(user => user.id === id)
    if (index === -1) return false

    mockUsers.splice(index, 1)
    return true
  }
}

// Re-export do tipo User para manter compatibilidade
export type { User }
