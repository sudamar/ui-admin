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
  shortDescription?: string
  fullDescription?: Record<string, unknown> | string | null
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
  justificativa?: Record<string, unknown> | string | null
  objetivos?: Record<string, unknown> | string | null
  publico?: Record<string, unknown> | string | null
  investmentDetails?: Record<string, unknown> | string | null
  additionalInfo?: Record<string, unknown> | string | null
  coordenadorId?: string
  createdAt?: string
  updatedAt?: string
  videoUrl?: string
  imageUrl?: string
  highlights?: CursoHighlight[]
  professores?: CursoProfessor[]
  availability?: CourseAvailability
  tags?: CourseTag[]
  is_ativo?: boolean
}

// Interface para preview (compatibilidade com código existente)
export interface CoursePreview {
  id: string
  title: string
  shortDescription: string
  category: string
  categoryLabel?: string
  image_folder?: string
  price?: number
  originalPrice?: number
  availability: CourseAvailability
  tags: CourseTag[]
  is_ativo?: boolean
}

// Tipo para detalhes do curso com campos estendidos para formulário
export interface CourseDetails extends Omit<Curso, 'fullDescription' | 'justificativa' | 'objetivos' | 'publico'> {
  fullDescription?: string[]
  justificativa?: string[]
  objetivos?: string[]
  publico?: string[]
}

type CursosResponse =
  | { success: true; cursos: Curso[] }
  | { success: true; curso: Curso }
  | { success: false; message?: string }

const API_URL = "/api/cursos"

async function handleResponse(response: Response): Promise<CursosResponse> {
  console.log("[cursosService] handleResponse - Status:", response.status)
  console.log("[cursosService] handleResponse - Headers:", Object.fromEntries(response.headers.entries()))

  // Clonar a resposta para ler o body sem consumí-lo
  const clonedResponse = response.clone()
  const rawText = await clonedResponse.text()
  console.log("[cursosService] handleResponse - Raw Response Text (length:", rawText.length, "):", rawText)

  // Verificar se a resposta está vazia
  if (!rawText || rawText.trim() === '') {
    console.error("[cursosService] handleResponse - ⚠️ RESPOSTA VAZIA!")
    console.error("[cursosService] handleResponse - Status:", response.status)
    console.error("[cursosService] handleResponse - StatusText:", response.statusText)
    console.error("[cursosService] handleResponse - URL:", response.url)
    throw new Error("A API retornou uma resposta vazia")
  }

  if (!response.ok) {
    let errorBody: { message?: string } | null = null

    try {
      errorBody = JSON.parse(rawText) as { message?: string }
    } catch (e) {
      console.error("[cursosService] handleResponse - Erro ao parsear JSON de erro:", e)
      console.error("[cursosService] handleResponse - Raw text recebido:", rawText)
    }

    console.error("[cursosService] handleResponse - ERRO DETALHADO:", {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      rawText,
      errorBody,
      headers: Object.fromEntries(response.headers.entries())
    })

    throw new Error(
      errorBody?.message ?? "Não foi possível processar a solicitação.",
    )
  }

  let jsonResponse: CursosResponse
  try {
    jsonResponse = JSON.parse(rawText) as CursosResponse
    console.log("[cursosService] handleResponse - ✅ Sucesso (parsed):", JSON.stringify(jsonResponse, null, 2))
  } catch (e) {
    console.error("[cursosService] handleResponse - ❌ Erro ao parsear JSON de sucesso:", e)
    console.error("[cursosService] handleResponse - Raw text:", rawText)
    console.error("[cursosService] handleResponse - Raw text length:", rawText.length)
    console.error("[cursosService] handleResponse - First 100 chars:", rawText.substring(0, 100))
    throw new Error("Resposta da API não é um JSON válido")
  }

  return jsonResponse
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
    shortDescription: enriched.shortDescription ?? "",
    category: enriched.category ?? "outros",
    categoryLabel: enriched.categoryLabel,
    image_folder: enriched.image_folder,
    price: enriched.price,
    originalPrice: enriched.originalPrice,
    availability: enriched.availability!,
    tags: enriched.tags!,
    is_ativo: enriched.is_ativo ?? true,
  }
}

const serializePayload = (input: Omit<Curso, "id" | "createdAt" | "updatedAt">) => {
  console.log("[cursosService] serializePayload - INPUT:", JSON.stringify(input, null, 2))

  const serialized = {
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle ?? "",
    shortDescription: input.shortDescription ?? "",
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
  }

  console.log("[cursosService] serializePayload - OUTPUT:", JSON.stringify(serialized, null, 2))
  return serialized
}

export const cursosService = {
  async getAll(): Promise<CoursePreview[]> {
    const response = await fetch(API_URL, {
      credentials: "include",
    })

    const result = await handleResponse(response)
    if (!result.success) {
      throw new Error(result.message || "Erro ao buscar cursos")
    }
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
    if (!result.success) {
      throw new Error(result.message || "Erro ao buscar curso")
    }
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
    if (!result.success) {
      throw new Error(result.message || "Erro ao buscar curso")
    }
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
    if (!result.success) {
      throw new Error(result.message || "Erro ao criar curso")
    }
    const curso = "curso" in result ? result.curso : result.cursos[0]

    return enrichCurso(curso)
  },

  async update(id: string, data: Omit<Curso, "id" | "createdAt" | "updatedAt">): Promise<Curso> {
    console.log(`[cursosService] update - ID: ${id}`)
    console.log("[cursosService] update - Data recebida:", data)

    const serializedData = serializePayload(data)
    const bodyString = JSON.stringify(serializedData)

    console.log("[cursosService] update - Body que será enviado:", bodyString)
    console.log("[cursosService] update - URL:", `${API_URL}?id=${encodeURIComponent(id)}`)

    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: bodyString,
    })

    console.log("[cursosService] update - Response status:", response.status)
    console.log("[cursosService] update - Response ok:", response.ok)

    const result = await handleResponse(response)
    if (!result.success) {
      throw new Error(result.message || "Erro ao atualizar curso")
    }
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
