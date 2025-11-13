export interface MembroAnalista {
  id: string
  nome: string
  tipo: string
  atendimento: string
  cidade?: string
  estado?: string
  descricao?: string
  telefone?: string
  email?: string
  foto?: string
  linkMembro?: string
  createdAt?: string
  updatedAt?: string
}

type MembrosAnalistasResponse =
  | { success: true; membros: MembroAnalista[] }
  | { success: true; membro: MembroAnalista }
  | { success: false; message?: string }

const API_URL = "/api/membros-analistas"

async function handleResponse(response: Response): Promise<MembrosAnalistasResponse> {
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null
    throw new Error(
      errorBody?.message ?? "Não foi possível processar a solicitação.",
    )
  }

  return (await response.json()) as MembrosAnalistasResponse
}

const serializePayload = (input: Omit<MembroAnalista, "id">) => ({
  nome: input.nome,
  tipo: input.tipo,
  atendimento: input.atendimento,
  cidade: input.cidade ?? null,
  estado: input.estado ?? null,
  descricao: input.descricao ?? null,
  telefone: input.telefone ?? null,
  email: input.email ?? null,
  foto: input.foto ?? null,
  linkMembro: input.linkMembro ?? null,
})

export const membrosAnalistasService = {
  async getAll(): Promise<MembroAnalista[]> {
    const response = await fetch(API_URL, {
      credentials: "include",
    })

    const result = await handleResponse(response)
    if (!result.success) {
      throw new Error(result.message || "Erro ao buscar membros")
    }
    const members = "membros" in result ? result.membros : [result.membro]

    return [...members].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
    )
  },

  async getById(id: string): Promise<MembroAnalista | null> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      credentials: "include",
    })

    if (response.status === 404) {
      return null
    }

    const result = await handleResponse(response)
    if (!result.success) {
      throw new Error(result.message || "Erro ao buscar membro")
    }
    if ("membro" in result) {
      return result.membro
    }

    return result.membros[0] ?? null
  },

  async create(data: Omit<MembroAnalista, "id">): Promise<MembroAnalista> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(serializePayload(data)),
    })

    const result = await handleResponse(response)
    if (!result.success) {
      throw new Error(result.message || "Erro ao criar membro")
    }
    if ("membro" in result) {
      return result.membro
    }

    return result.membros[0]
  },

  async update(id: string, data: Omit<MembroAnalista, "id">): Promise<MembroAnalista> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(serializePayload(data)),
    })

    const result = await handleResponse(response)
    if (!result.success) {
      throw new Error(result.message || "Erro ao atualizar membro")
    }
    if ("membro" in result) {
      return result.membro
    }

    return result.membros[0]
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as
        | { message?: string }
        | null
      throw new Error(
        errorBody?.message ?? "Não foi possível remover o membro analista.",
      )
    }
  },
}
