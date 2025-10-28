import trabalhosData from "@/data/trabalhos/trabalhos.json"

export interface Trabalho {
  titulo: string
  autor: string
  data_publicacao: string
  link: string
  tags: string[]
  slug: string
  resumo?: string
  nota?: number
  visitantes: number
  baixados?: number
  arquivo?: string
}

const store: Trabalho[] = [...trabalhosData]

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const trabalhosService = {
  async getAll(): Promise<Trabalho[]> {
    await delay(150)
    return [...store]
  },

  async getBySlug(slug: string): Promise<Trabalho | undefined> {
    await delay(150)
    return store.find((item) => item.slug === slug)
  },

  async update(slug: string, data: Trabalho): Promise<Trabalho> {
    await delay(250)
    const index = store.findIndex((item) => item.slug === slug)
    if (index === -1) {
      throw new Error("Trabalho não encontrado.")
    }

    const updated: Trabalho = { ...data }
    store[index] = updated
    return updated
  },
}
