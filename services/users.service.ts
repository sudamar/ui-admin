export interface User {
  id: number
  name: string
  email: string
  role: string
  status: "active" | "inactive"
  createdAt: string
  avatar?: string
}

// Dados mockados
const mockUsers: User[] = [
  {
    id: 1,
    name: "João Silva",
    email: "joao.silva@fafih.com",
    role: "Admin",
    status: "active",
    createdAt: "2024-01-15",
    avatar: "/avatars/1.png"
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria.santos@fafih.com",
    role: "Editor",
    status: "active",
    createdAt: "2024-02-20",
    avatar: "/avatars/2.png"
  },
  {
    id: 3,
    name: "Pedro Oliveira",
    email: "pedro.oliveira@fafih.com",
    role: "Viewer",
    status: "inactive",
    createdAt: "2024-03-10",
    avatar: "/avatars/3.png"
  },
  {
    id: 4,
    name: "Ana Costa",
    email: "ana.costa@fafih.com",
    role: "Editor",
    status: "active",
    createdAt: "2024-01-25",
    avatar: "/avatars/4.png"
  },
  {
    id: 5,
    name: "Carlos Ferreira",
    email: "carlos.ferreira@fafih.com",
    role: "Admin",
    status: "active",
    createdAt: "2024-02-05",
    avatar: "/avatars/5.png"
  },
  {
    id: 6,
    name: "Juliana Lima",
    email: "juliana.lima@fafih.com",
    role: "Viewer",
    status: "active",
    createdAt: "2024-03-15",
    avatar: "/avatars/6.png"
  },
  {
    id: 7,
    name: "Roberto Alves",
    email: "roberto.alves@fafih.com",
    role: "Editor",
    status: "inactive",
    createdAt: "2024-01-30",
    avatar: "/avatars/7.png"
  },
  {
    id: 8,
    name: "Fernanda Souza",
    email: "fernanda.souza@fafih.com",
    role: "Viewer",
    status: "active",
    createdAt: "2024-02-28",
    avatar: "/avatars/8.png"
  }
]

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
  create: async (user: Omit<User, "id" | "createdAt">): Promise<User> => {
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
  update: async (id: number, data: Partial<User>): Promise<User | undefined> => {
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
