import categoriasData from "@/data/trabalhos/trabalhos_categorias.json"

export interface Categoria {
  slug: string
  label: string
  icon?: string
  className: string
}

const store: Categoria[] = categoriasData.map((categoria) => ({
  slug: categoria.slug,
  label: categoria.label,
  icon: categoria.icon,
  className: categoria.className,
}))

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const slugify = (input: string) =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

export const categoriasService = {
  async getAll(): Promise<Categoria[]> {
    await delay(150)
    return [...store]
  },

  async getBySlug(slug: string): Promise<Categoria | undefined> {
    await delay(120)
    return store.find((item) => item.slug === slug)
  },

  async create(data: Categoria): Promise<Categoria> {
    await delay(200)
    const slug = data.slug ? slugify(data.slug) : slugify(data.label)
    if (store.some((item) => item.slug === slug)) {
      throw new Error("Já existe uma categoria com esse slug.")
    }

    const categoria: Categoria = {
      slug,
      label: data.label,
      icon: data.icon,
      className: data.className,
    }

    store.unshift(categoria)
    return categoria
  },

  async update(slug: string, data: Categoria): Promise<Categoria> {
    await delay(200)
    const index = store.findIndex((item) => item.slug === slug)
    if (index === -1) {
      throw new Error("Categoria não encontrada.")
    }

    const updated: Categoria = {
      slug: data.slug ? slugify(data.slug) : slug,
      label: data.label,
      icon: data.icon,
      className: data.className,
    }

    store[index] = updated
    return updated
  },

  async delete(slug: string): Promise<void> {
    await delay(150)
    const index = store.findIndex((item) => item.slug === slug)
    if (index === -1) {
      throw new Error("Categoria não encontrada.")
    }

    store.splice(index, 1)
  },
}
