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

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

let categoriasCache: Categoria[] | null = null
let categoriasPromise: Promise<Categoria[]> | null = null

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

const normalizeCategoria = (categoria: Categoria): Categoria => {
  const normalizedSlug =
    categoria.slug && categoria.slug.trim().length > 0
      ? categoria.slug.trim()
      : slugify(categoria.nome)

  return {
    ...categoria,
    slug: normalizedSlug,
    icone: categoria.icone ?? null,
    cor: categoria.cor ?? null,
  }
}

function cacheCategorias(categorias: Categoria[]) {
  categoriasCache = categorias.map(normalizeCategoria)
  categoriasPromise = null
  return categoriasCache
}

async function fetchCategorias(): Promise<Categoria[]> {
  const response = await fetch(API_URL, {
    credentials: "include",
  })

  const result = await handleResponse(response)

  if ("categorias" in result) {
    return cacheCategorias(result.categorias)
  }

  return cacheCategorias([result.categoria])
}

export const categoriasService = {
  async getAll(options?: { force?: boolean }): Promise<Categoria[]> {
    if (!options?.force) {
      if (categoriasCache) {
        return categoriasCache
      }
      if (categoriasPromise) {
        return categoriasPromise
      }
    }

    categoriasPromise = fetchCategorias()
    return categoriasPromise
  },

  async getById(id: string): Promise<Categoria | null> {
    if (categoriasCache && !categoriasPromise) {
      const categoriaFromCache = categoriasCache.find((categoria) => categoria.id === id)
      if (categoriaFromCache) {
        return categoriaFromCache
      }
    }

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

    const categoria = result.categorias[0] ?? null
    if (categoria) {
      cacheCategorias(result.categorias)
    }
    return categoria
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

    categoriasCache = null
    categoriasPromise = null

    if ("categoria" in result) {
      return normalizeCategoria(result.categoria)
    }

    return normalizeCategoria(result.categorias[0])
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

    categoriasCache = null
    categoriasPromise = null

    if ("categoria" in result) {
      return normalizeCategoria(result.categoria)
    }

    return normalizeCategoria(result.categorias[0])
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
    categoriasCache = null
    categoriasPromise = null
  },

  invalidateCache() {
    categoriasCache = null
    categoriasPromise = null
  },
}
