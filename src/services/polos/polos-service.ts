import polosData from "@/data/polos/polos.json"

export interface Polo {
  id: string
  name: string
  location: string
  address: string
  phone: string
  email: string
  coordinator: string
  mapUrl?: string
  courses: string[]
}

type CreatePoloInput = Omit<Polo, "id">

const store: Polo[] = polosData.locations.map((location) => ({
  id: location.id,
  name: location.name,
  location: location.location ?? location.name,
  address: location.address,
  phone: location.phone,
  email: location.email,
  coordinator: location.coordinator,
  mapUrl: location.mapUrl,
  courses: location.courses,
}))

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const polosService = {
  async getAll(): Promise<Polo[]> {
    await delay(200)
    return [...store]
  },

  async getById(id: string): Promise<Polo | undefined> {
    await delay(150)
    return store.find((item) => item.id === id)
  },

  async create(input: CreatePoloInput): Promise<Polo> {
    await delay(250)
    const baseId = slugify(input.name)
    const uniqueId = baseId || `polo-${Date.now()}`

    if (store.some((polo) => polo.id === uniqueId)) {
      throw new Error("Já existe um polo com esse identificador.")
    }

    const newPolo: Polo = {
      ...input,
      id: uniqueId,
    }

    store.push(newPolo)
    return newPolo
  },

  async update(id: string, input: CreatePoloInput): Promise<Polo> {
    await delay(250)
    const index = store.findIndex((polo) => polo.id === id)
    if (index === -1) {
      throw new Error("Polo não encontrado.")
    }

    const updated: Polo = { ...store[index], ...input, id }
    store[index] = updated
    return updated
  },

  async delete(id: string): Promise<boolean> {
    await delay(200)
    const index = store.findIndex((polo) => polo.id === id)
    if (index === -1) {
      return false
    }

    store.splice(index, 1)
    return true
  },
}
