export type CourseAvailability = "promotion" | "open" | "limited" | "sold-out"

export interface CourseTag {
  label: string
  variant?: "default" | "secondary" | "outline" | "destructive"
  className?: string
}

export interface CursoHighlight {
  id: string
  icon: string
  title: string
  description: string
  bgColor?: string
  iconColor?: string
  ordem: number
}

export interface CursoProfessor {
  id: string
  professorId: string
  papel?: string
}

export interface Curso {
  id: string
  slug: string
  title: string
  subtitle?: string
  description?: string
  fullDescription?: Record<string, unknown>
  image_folder?: string
  category?: string
  categoryLabel?: string
  price?: number
  originalPrice?: number
  precoMatricula?: number
  modalidade?: string
  duration?: string
  workload?: string
  startDate?: string
  maxStudents?: string
  certificate?: string
  monthlyPrice?: string
  justificativa?: Record<string, unknown>
  objetivos?: Record<string, unknown>
  publico?: Record<string, unknown>
  investmentDetails?: Record<string, unknown>
  additionalInfo?: Record<string, unknown>
  coordenadorId?: string
  createdAt?: string
  updatedAt?: string
  videoUrl?: string
  imageUrl?: string
  highlights?: CursoHighlight[]
  professores?: CursoProfessor[]
  availability?: CourseAvailability
  tags?: CourseTag[]
}

// Interface para preview (compatibilidade com código existente)
export interface CoursePreview {
  id: string
  title: string
  description: string
  category: string
  categoryLabel?: string
  image_folder?: string
  price?: number
  originalPrice?: number
  availability: CourseAvailability
  tags: CourseTag[]
}

type CursosResponse =
  | { success: true; cursos: Curso[] }
  | { success: true; curso: Curso }
  | { success: false; message?: string }

const API_URL = "/api/cursos"

async function handleResponse(response: Response): Promise<CursosResponse> {
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as
      | { message?: string }
      | null
    throw new Error(
      errorBody?.message ?? "Não foi possível processar a solicitação.",
    )
  }

  return (await response.json()) as CursosResponse
}

// Funções auxiliares para compatibilidade
function computeAvailability(curso: Curso): CourseAvailability {
  // Lógica para determinar disponibilidade
  // Por enquanto, retorna "open" por padrão, mas pode ser baseado em:
  // - Promoção: se originalPrice > price
  // - Vagas limitadas: baseado em maxStudents
  // - Esgotado: baseado em algum campo futuro

  if (
    typeof curso.originalPrice === "number" &&
    typeof curso.price === "number" &&
    curso.originalPrice > curso.price
  ) {
    return "promotion"
  }

  // Se tiver maxStudents definido e for um número baixo, pode ser "limited"
  const maxStudents = curso.maxStudents ? parseInt(curso.maxStudents, 10) : 0
  if (maxStudents > 0 && maxStudents <= 10) {
    return "limited"
  }

  return "open"
}

function buildTags(curso: Curso): CourseTag[] {
  const tags: CourseTag[] = []
  const availability = curso.availability ?? computeAvailability(curso)

  if (availability === "promotion") {
    tags.push({
      label: "Promoção",
      variant: "default",
      className: "bg-emerald-500 text-white hover:bg-emerald-600",
    })
  }

  switch (availability) {
    case "open":
      tags.push({
        label: "Vagas em aberto",
        variant: "secondary",
      })
      break
    case "limited":
      tags.push({
        label: "Faltam 5 vagas",
        variant: "outline",
        className: "border-amber-500 text-amber-600",
      })
      break
    case "sold-out":
      tags.push({
        label: "Esgotado",
        variant: "destructive",
      })
      break
  }

  return tags
}

function enrichCurso(curso: Curso): Curso {
  const availability = curso.availability ?? computeAvailability(curso)
  const tags = curso.tags ?? buildTags({ ...curso, availability })

  return {
    ...curso,
    availability,
    tags,
  }
}

function toCoursePreview(curso: Curso): CoursePreview {
  const enriched = enrichCurso(curso)
  return {
    id: enriched.id,
    title: enriched.title,
    description: enriched.description ?? "",
    category: enriched.category ?? "outros",
    categoryLabel: enriched.categoryLabel,
    image_folder: enriched.image_folder,
    price: enriched.price,
    originalPrice: enriched.originalPrice,
    availability: enriched.availability!,
    tags: enriched.tags!,
  }
}

const serializePayload = (input: Omit<Curso, "id" | "createdAt" | "updatedAt">) => ({
  slug: input.slug,
  title: input.title,
  subtitle: input.subtitle ?? "",
  description: input.description ?? "",
  fullDescription: input.fullDescription ?? null,
  image_folder: input.image_folder ?? "",
  category: input.category ?? "",
  categoryLabel: input.categoryLabel ?? "",
  price: input.price ?? 0,
  originalPrice: input.originalPrice ?? 0,
  precoMatricula: input.precoMatricula ?? 0,
  modalidade: input.modalidade ?? "",
  duration: input.duration ?? "",
  workload: input.workload ?? "",
  startDate: input.startDate ?? "",
  maxStudents: input.maxStudents ?? "",
  certificate: input.certificate ?? "",
  monthlyPrice: input.monthlyPrice ?? "",
  justificativa: input.justificativa ?? null,
  objetivos: input.objetivos ?? null,
  publico: input.publico ?? null,
  investmentDetails: input.investmentDetails ?? null,
  additionalInfo: input.additionalInfo ?? null,
  coordenadorId: input.coordenadorId ?? null,
  videoUrl: input.videoUrl ?? "",
  imageUrl: input.imageUrl ?? "",
  highlights: input.highlights ?? [],
  professores: input.professores ?? [],
})

export const cursosService = {
  async getAll(): Promise<CoursePreview[]> {
    const response = await fetch(API_URL, {
      credentials: "include",
    })

    const result = await handleResponse(response)
    const cursos = "cursos" in result ? result.cursos : [result.curso]

    return cursos
      .map(enrichCurso)
      .map(toCoursePreview)
      .sort((a, b) =>
        a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" }),
      )
  },

  async getById(id: string): Promise<Curso | null> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      credentials: "include",
    })

    if (response.status === 404) {
      return null
    }

    const result = await handleResponse(response)
    const curso = "curso" in result ? result.curso : result.cursos[0]

    return curso ? enrichCurso(curso) : null
  },

  async getBySlug(slug: string): Promise<Curso | null> {
    const response = await fetch(`${API_URL}?slug=${encodeURIComponent(slug)}`, {
      credentials: "include",
    })

    if (response.status === 404) {
      return null
    }

    const result = await handleResponse(response)
    const curso = "curso" in result ? result.curso : result.cursos[0]

    return curso ? enrichCurso(curso) : null
  },

  async create(data: Omit<Curso, "id" | "createdAt" | "updatedAt">): Promise<Curso> {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(serializePayload(data)),
    })

    const result = await handleResponse(response)
    const curso = "curso" in result ? result.curso : result.cursos[0]

    return enrichCurso(curso)
  },

  async update(id: string, data: Omit<Curso, "id" | "createdAt" | "updatedAt">): Promise<Curso> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(serializePayload(data)),
    })

    const result = await handleResponse(response)
    const curso = "curso" in result ? result.curso : result.cursos[0]

    return enrichCurso(curso)
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
        errorBody?.message ?? "Não foi possível remover o curso.",
      )
    }
  },
}
