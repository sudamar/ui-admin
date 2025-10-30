export interface Categoria {
  id: string
  nome: string
  slug: string
  icone?: string | null
  cor?: string | null
}

type CategoriasListResponse =
  | {
      success: true
      categorias: Categoria[]
    }
  | {
      success: true
      categoria: Categoria
    }
  | {
      success: false
      message?: string
    }

const API_URL = "/api/categorias"

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null
    throw new Error(
      errorBody?.message ?? "Não foi possível processar a solicitação."
    )
  }

  const result = (await response.json()) as CategoriasListResponse
  if (!("success" in result) || !result.success) {
    throw new Error(
      "message" in result && result.message
        ? result.message
        : "Não foi possível processar a solicitação."
    )
  }

  return result
}

export const categoriasService = {
  async getAll(): Promise<Categoria[]> {
    const response = await fetch(API_URL, {
      credentials: "include",
    })

    const result = await handleResponse(response)

    if ("categorias" in result) {
      return result.categorias
    }

    return [result.categoria]
  },

  async getById(id: string): Promise<Categoria | null> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      credentials: "include",
    })

    if (response.status === 404) {
      return null
    }

    const result = await handleResponse(response)

    if ("categoria" in result) {
      return result.categoria
    }

    return result.categorias[0] ?? null
  },

  async create(data: { nome: string; slug: string; icone?: string | null; cor?: string | null }): Promise<Categoria> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })

    const result = await handleResponse(response)

    if ("categoria" in result) {
      return result.categoria
    }

    return result.categorias[0]
  },

  async update(
    id: string,
    data: { nome: string; slug: string; icone?: string | null; cor?: string | null }
  ): Promise<Categoria> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(data),
    })

    const result = await handleResponse(response)

    if ("categoria" in result) {
      return result.categoria
    }

    return result.categorias[0]
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
        errorBody?.message ?? "Não foi possível remover a categoria."
      )
    }
  },
}
