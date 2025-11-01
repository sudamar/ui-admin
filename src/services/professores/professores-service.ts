export interface Professor {
  id: string
  nome: string
  titulacao?: string
  descricao?: string
  foto?: string
  email?: string
  telefone?: string
  linkProfessor?: string
  createdAt?: string
  updatedAt?: string
}

type ProfessoresResponse =
  | { success: true; professores: Professor[] }
  | { success: true; professor: Professor }
  | { success: false; message?: string }

const API_URL = "/api/professores"

async function handleResponse(response: Response): Promise<ProfessoresResponse> {
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null
    throw new Error(
      errorBody?.message ?? "Não foi possível processar a solicitação.",
    )
  }

  return (await response.json()) as ProfessoresResponse
}

const serializePayload = (input: Omit<Professor, "id">) => ({
  nome: input.nome,
  titulacao: input.titulacao ?? null,
  descricao: input.descricao ?? null,
  foto: input.foto ?? null,
  email: input.email ?? null,
  telefone: input.telefone ?? null,
  linkProfessor: input.linkProfessor ?? null,
})

export const professoresService = {
  async getAll(): Promise<Professor[]> {
    const response = await fetch(API_URL, {
      credentials: "include",
    })

    const result = await handleResponse(response)
    if ("professores" in result) {
      return [...result.professores].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
      )
    }

    return [result.professor].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
    )
  },

  async getById(id: string): Promise<Professor | null> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      credentials: "include",
    })

    if (response.status === 404) {
      return null
    }

    const result = await handleResponse(response)
    if ("professor" in result) {
      return result.professor
    }

    return result.professores[0] ?? null
  },

  async create(data: Omit<Professor, "id">): Promise<Professor> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(serializePayload(data)),
    })

    const result = await handleResponse(response)
    if ("professor" in result) {
      return result.professor
    }

    return result.professores[0]
  },

  async update(id: string, data: Omit<Professor, "id">): Promise<Professor> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(serializePayload(data)),
    })

    const result = await handleResponse(response)
    if ("professor" in result) {
      return result.professor
    }

    return result.professores[0]
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
        errorBody?.message ?? "Não foi possível remover o professor.",
      )
    }
  },
}
