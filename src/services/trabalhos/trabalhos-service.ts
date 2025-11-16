import { imprimeLogs } from "@/lib/logger"

export interface Trabalho {
  id: string
  titulo: string
  autor: string
  data_publicacao: string
  link: string
  tags: string[]
  slug: string
  resumo?: string | null
  nota?: number | null
  visitantes: number
  baixados?: number | null
  arquivo?: string | null
}

type TrabalhosListResponse =
  | {
      success: true
      trabalhos: Trabalho[]
    }
  | {
      success: true
      trabalho: Trabalho
    }
  | {
      success: false
      message?: string
    }

const API_URL = "/api/trabalhos"

async function handleResponse(response: Response) {
  if (!response.ok) {
    imprimeLogs("*******************")
    imprimeLogs("Erro na resposta da API", response.status)
    imprimeLogs("Erro na resposta da API", await response.text())
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null
    throw new Error(
      errorBody?.message ?? "Não foi possível processar a solicitação."
    )
  }

  const result = (await response.json()) as TrabalhosListResponse
  if (!("success" in result) || !result.success) {
    throw new Error(
      "message" in result && result.message
        ? result.message
        : "Não foi possível processar a solicitação."
    )
  }

  return result
}

export const trabalhosService = {
  async getAll(): Promise<Trabalho[]> {
    const response = await fetch(API_URL, {
      credentials: "include",
    })

    const result = await handleResponse(response)

    if ("trabalhos" in result) {
      return result.trabalhos
    }

    return [result.trabalho]
  },

  async getById(id: string): Promise<Trabalho | null> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      credentials: "include",
    })

    if (response.status === 404) {
      return null
    }

    const result = await handleResponse(response)

    if ("trabalho" in result) {
      return result.trabalho
    }

    return result.trabalhos[0] ?? null
  },

  async getBySlug(slug: string): Promise<Trabalho | null> {
    const response = await fetch(`${API_URL}?slug=${encodeURIComponent(slug)}`, {
      credentials: "include",
    })

    if (response.status === 404) {
      return null
    }

    const result = await handleResponse(response)

    if ("trabalho" in result) {
      return result.trabalho
    }

    return result.trabalhos[0] ?? null
  },

  async create(data: {
    titulo: string
    autor: string
    slug: string
    data_publicacao: string
    link: string
    tags: string[]
    resumo?: string | null
    nota?: number | null
    visitantes?: number
    baixados?: number | null
    arquivo?: string | null
  }): Promise<Trabalho> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })

    const result = await handleResponse(response)

    if ("trabalho" in result) {
      return result.trabalho
    }

    return result.trabalhos[0]
  },

  async update(
    id: string,
    data: {
      titulo: string
      autor: string
      slug: string
      data_publicacao: string
      link: string
      tags: string[]
      resumo?: string | null
      nota?: number | null
      visitantes?: number
      baixados?: number | null
      arquivo?: string | null
    }
  ): Promise<Trabalho> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })

    const result = await handleResponse(response)

    if ("trabalho" in result) {
      return result.trabalho
    }

    return result.trabalhos[0]
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
        errorBody?.message ?? "Não foi possível remover o trabalho."
      )
    }
  },
}
