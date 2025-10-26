import usuariosData from "@/data/usuarios/usuarios.json"

export interface User {
  id: number
  name: string
  email: string
  role: string
  status: "active" | "inactive"
  createdAt: string
  avatar?: string
}

type CreateUserInput = Omit<User, "id" | "createdAt">

const store: User[] = usuariosData.usuarios.map((usuario) => ({
  id: usuario.id,
  name: usuario.name,
  email: usuario.email,
  role: usuario.role,
  status: usuario.status as "active" | "inactive",
  createdAt: usuario.createdAt,
  avatar: usuario.avatar,
}))

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const usersService = {
  async getAll(): Promise<User[]> {
    await delay(300)
    return [...store]
  },

  async getById(id: number): Promise<User | undefined> {
    await delay(200)
    return store.find((user) => user.id === id)
  },

  async create(input: CreateUserInput): Promise<User> {
    await delay(500)
    const nextId = store.length > 0 ? Math.max(...store.map((u) => u.id)) + 1 : 1
    const newUser: User = {
      ...input,
      id: nextId,
      createdAt: new Date().toISOString().split("T")[0],
      avatar: input.avatar ?? `/assets/avatares/${nextId}.png`,
    }
    store.push(newUser)
    return newUser
  },

  async update(id: number, data: Partial<User>): Promise<User | undefined> {
    await delay(500)
    const index = store.findIndex((user) => user.id === id)
    if (index === -1) return undefined

    store[index] = { ...store[index], ...data }
    return store[index]
  },

  async delete(id: number): Promise<boolean> {
    await delay(300)
    const index = store.findIndex((user) => user.id === id)
    if (index === -1) return false

    store.splice(index, 1)
    return true
  },
}
