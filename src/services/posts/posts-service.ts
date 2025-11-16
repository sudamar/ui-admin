export type Post = {
  id: string
  slug: string
  title: string
  date: string
  author: string
  authorInfo?: Record<string, unknown>
  excerpt: string
  content: string
  image: string
  published: boolean
  createdAt?: string
  updatedAt?: string
}

export type PostInput = Omit<Post, "id" | "createdAt" | "updatedAt" | "author"> & {
  author?: string
  authorInfo?: Record<string, unknown>
}

const API_URL = "/api/posts"

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(errorBody?.message ?? "Não foi possível processar a solicitação.")
  }
  return (await response.json()) as T
}

export const postsService = {
  async getAll(): Promise<Post[]> {
    const response = await fetch(`${API_URL}?orderBy=date&orderDir=desc`, { cache: "no-store" })
    const result = (await handleResponse<{ success: boolean; posts: Post[] }>(response)).posts
    return result
  },

  async getById(id: string): Promise<Post | null> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, { cache: "no-store" })
    if (response.status === 404) {
      return null
    }
    const result = await handleResponse<{ success: boolean; post: Post }>(response)
    return result.post
  },

  async create(data: PostInput): Promise<Post> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await handleResponse<{ success: boolean; post: Post }>(response)
    return result.post
  },

  async update(id: string, data: PostInput): Promise<Post> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    const result = await handleResponse<{ success: boolean; post: Post }>(response)
    return result.post
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
    await handleResponse<{ success: boolean }>(response)
  },
}
