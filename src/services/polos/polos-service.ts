export interface Polo {
  id: string
  slug: string
  name: string
  address?: string
  phone?: string
  email?: string
  coordinator?: string
  mapUrl?: string
}

type PoloApiResponse =
  | { success: true; polos: Polo[] }
  | { success: true; polo: Polo }
  | { success: false; message?: string }

type CreateOrUpdateInput = Omit<Polo, "id">

const API_URL = "/api/polos"

const serializePayload = (input: CreateOrUpdateInput) => ({
  slug: input.slug,
  name: input.name,
  address: input.address ?? null,
  phone: input.phone ?? null,
  email: input.email ?? null,
  coordinator: input.coordinator ?? null,
  mapUrl: input.mapUrl ?? null,
})

async function handleResponse(response: Response): Promise<PoloApiResponse> {
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null
    throw new Error(
      errorBody?.message ?? "Não foi possível processar a solicitação.",
    )
  }

  return (await response.json()) as PoloApiResponse
}

export const polosService = {
  async getAll(): Promise<Polo[]> {
    const response = await fetch(API_URL, {
      credentials: "include",
    })

    const result = await handleResponse(response)
    if (!result.success) {
      throw new Error(result.message || "Erro ao buscar polos")
    }
    if ("polos" in result) {
      return result.polos
    }

    return [result.polo]
  },

  async getById(id: string): Promise<Polo | null> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      credentials: "include",
    })

    if (response.status === 404) {
      return null
    }

    const result = await handleResponse(response)
    if (!result.success) {
      throw new Error(result.message || "Erro ao buscar polo")
    }
    if ("polo" in result) {
      return result.polo
    }

    return result.polos[0] ?? null
  },

  async create(input: CreateOrUpdateInput): Promise<Polo> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(serializePayload(input)),
    })

    const result = await handleResponse(response)
    if (!result.success) {
      throw new Error(result.message || "Erro ao criar polo")
    }
    if ("polo" in result) {
      return result.polo
    }

    return result.polos[0]
  },

  async update(id: string, input: CreateOrUpdateInput): Promise<Polo> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(serializePayload(input)),
    })

    const result = await handleResponse(response)
    if (!result.success) {
      throw new Error(result.message || "Erro ao atualizar polo")
    }
    if ("polo" in result) {
      return result.polo
    }

    return result.polos[0]
  },

  async delete(id: string): Promise<boolean> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    })

    if (response.status === 404) {
      return false
    }

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as
        | { message?: string }
        | null
      throw new Error(
        errorBody?.message ?? "Não foi possível remover o polo.",
      )
    }

    return true
  },
}
