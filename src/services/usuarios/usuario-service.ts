import { PerfilUsuario } from "@/services/auth/auth-service"

export interface User {
  id: string
  name: string
  email: string
  role: PerfilUsuario
  status: "active" | "inactive"
  createdAt: string
  avatar?: string | null
  lastSignInAt?: string | null
}

export interface UpdateUserInput {
  name: string
  email: string
  perfil: PerfilUsuario
  status: "active" | "inactive"
  avatarDataUrl?: string
}

type ApiUserResponse =
  | {
      success: true
      users: Array<{
        id: string
        name: string
        email: string
        role: PerfilUsuario
        status: "active" | "inactive"
        createdAt: string
        avatarUrl: string | null
        lastSignInAt?: string | null
      }>
    }
  | {
      success: true
      user: {
        id: string
        name: string
        email: string
        role: PerfilUsuario
        status: "active" | "inactive"
        createdAt: string
        avatarUrl: string | null
        lastSignInAt?: string | null
      }
    }
  | {
      success: false
      message?: string
    }

function mapApiUser(user: {
  id: string
  name: string
  email: string
  role: PerfilUsuario
  status: "active" | "inactive"
  createdAt: string
  avatarUrl: string | null
  lastSignInAt?: string | null
}): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    avatar: user.avatarUrl,
    lastSignInAt: user.lastSignInAt ?? null,
  }
}

export const usersService = {
  async getAll(): Promise<User[]> {
    const response = await fetch("/api/users", {
      credentials: "include",
    })

    if (!response.ok) {
      throw new Error("Não foi possível carregar a lista de usuários.")
    }

    const result = (await response.json()) as ApiUserResponse

    if (!("success" in result) || !result.success) {
      throw new Error(
        "message" in result && result.message
          ? result.message
          : "Não foi possível carregar a lista de usuários."
      )
    }

    if ("users" in result) {
      return result.users.map(mapApiUser)
    }

    return [mapApiUser(result.user)]
  },

  async getById(id: string): Promise<User | null> {
    const url = `/api/users?id=${encodeURIComponent(id)}`
    const response = await fetch(url, {
      credentials: "include",
    })

    if (response.status === 404) {
      return null
    }

    if (!response.ok) {
      throw new Error("Não foi possível carregar o usuário solicitado.")
    }

    const result = (await response.json()) as ApiUserResponse

    if (!("success" in result) || !result.success || !("user" in result)) {
      throw new Error(
        "message" in result && result.message
          ? result.message
          : "Não foi possível carregar o usuário solicitado."
      )
    }

    return mapApiUser(result.user)
  },

  async create(_input: unknown): Promise<User> {
    throw new Error("Criação de usuários via usersService não está disponível.")
  },

  async update(id: string, data: UpdateUserInput): Promise<User> {
    const response = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as
        | { message?: string }
        | null
      throw new Error(
        errorBody?.message ?? "Não foi possível atualizar o usuário."
      )
    }

    const result = (await response.json()) as ApiUserResponse

    if (!("success" in result) || !result.success || !("user" in result)) {
      throw new Error(
        "message" in result && result.message
          ? result.message
          : "Não foi possível atualizar o usuário."
      )
    }

    return mapApiUser(result.user)
  },

  async delete(_id: string): Promise<boolean> {
    throw new Error("Remoção de usuários via usersService não está disponível.")
  },
}
