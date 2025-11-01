import cursosData from "@/data/cursos/cursos.json"

export type CourseAvailability =
  | "promotion"
  | "open"
  | "limited"
  | "sold-out"

export interface CourseTag {
  label: string
  variant?: "default" | "secondary" | "outline" | "destructive"
  className?: string
}

export interface CoursePreview {
  id: number
  title: string
  description: string
  category: string
  categoryLabel?: string
  image?: string
  price?: number
  originalPrice?: number
  availability: CourseAvailability
  tags: CourseTag[]
}

export interface CourseHero {
  type?: string
  source?: string
  alt?: string
  fallbackImage?: string
}

export interface CourseDetails extends CoursePreview {
  slug: string
  subtitle?: string
  fullDescription?: string[]
  hero?: CourseHero
  modalidade?: string
  duration?: string
  workload?: string
  startDate?: string
  maxStudents?: string
  certificate?: string
  price?: number
  originalPrice?: number
  precoMatricula?: number
  monthlyPrice?: string
  justificativa?: string[]
  objetivos?: string[]
  publico?: string[]
  highlights?: Array<{
    title?: string
    description?: string
    icon?: string
    bgColor?: string
    iconColor?: string
  }>
  ctaLabel?: string
  moreInfoUrl?: string
  availability: CourseAvailability
}

const AVAILABILITY_SEQUENCE: CourseAvailability[] = [
  "promotion",
  "open",
  "limited",
  "sold-out",
]

function computeAvailability(index: number): CourseAvailability {
  return AVAILABILITY_SEQUENCE[index % AVAILABILITY_SEQUENCE.length]
}

function buildTags(course: CourseDetails): CourseTag[] {
  const tags: CourseTag[] = []

  if (
    typeof course.originalPrice === "number" &&
    typeof course.price === "number" &&
    course.originalPrice > course.price
  ) {
    tags.push({
      label: "Promoção",
      variant: "default",
      className: "bg-emerald-500 text-white hover:bg-emerald-600",
    })
  }

  switch (course.availability) {
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

function stripHtml(value?: string) {
  if (!value) return ""
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

const rawCourses: CourseDetails[] = cursosData.map((curso, index) => {
  const availability = computeAvailability(index)
  return {
    id: curso.id,
    slug: curso.slug,
    title: curso.title,
    subtitle: curso.subtitle,
    description: curso.description ?? "",
    fullDescription: curso.fullDescription ?? [],
    hero: curso.hero,
    category: curso.category ?? "outros",
    categoryLabel: curso.categoryLabel,
    image: curso.image,
    price: curso.price,
    originalPrice: curso.originalPrice,
    precoMatricula: curso.precoMatricula,
    monthlyPrice: curso.monthlyPrice,
    modalidade: curso.modalidade,
    duration: curso.duration,
    workload: curso.workload,
    startDate: curso.startDate,
    maxStudents: curso.maxStudents,
    certificate: curso.certificate,
    justificativa: curso.justificativa ?? [],
    objetivos: curso.objetivos ?? [],
    publico: curso.publico ?? [],
    highlights: curso.highlights ?? [],
    ctaLabel: curso.ctaLabel,
    moreInfoUrl: curso.moreInfoUrl,
    availability,
    tags: [],
  }
})

rawCourses.forEach((course, index) => {
  rawCourses[index].tags = buildTags(course)
})

const coursesStore: CoursePreview[] = rawCourses.map((course) => ({
  id: course.id,
  title: course.title,
  description: stripHtml(course.description) || course.description || "",
  category: course.category,
  categoryLabel: course.categoryLabel,
  image: course.image,
  price: course.price,
  originalPrice: course.originalPrice,
  availability: course.availability,
  tags: buildTags(course),
}))

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const coursesService = {
  async getAll(): Promise<CoursePreview[]> {
    await delay(200)
    return [...coursesStore].sort((a, b) =>
      a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" }),
    )
  },
  async getById(id: number): Promise<CourseDetails | undefined> {
    await delay(150)
    return rawCourses.find((course) => course.id === id)
  },
  async create(course: Omit<CourseDetails, "id" | "tags">): Promise<CourseDetails> {
    await delay(250)
    const nextId = rawCourses.length > 0 ? Math.max(...rawCourses.map((c) => c.id)) + 1 : 1
    const details: CourseDetails = {
      ...course,
      id: nextId,
      tags: [],
      description: course.description ?? "",
      category: course.category ?? "outros",
    }
    details.tags = buildTags(details)
    rawCourses.push(details)
    coursesStore.push({
      id: details.id,
      title: details.title,
      description: stripHtml(details.description) || details.description || "",
      category: details.category,
      categoryLabel: details.categoryLabel,
      image: details.image,
      price: details.price,
      originalPrice: details.originalPrice,
      availability: details.availability,
      tags: details.tags,
    })
    return details
  },
  async update(id: number, partial: Partial<CourseDetails>): Promise<CourseDetails | undefined> {
    await delay(250)
    const index = rawCourses.findIndex((course) => course.id === id)
    if (index === -1) return undefined

    rawCourses[index] = {
      ...rawCourses[index],
      ...partial,
    }
    rawCourses[index].tags = buildTags(rawCourses[index])

    const previewIndex = coursesStore.findIndex((course) => course.id === id)
    if (previewIndex !== -1) {
      coursesStore[previewIndex] = {
        id: rawCourses[index].id,
        title: rawCourses[index].title,
        description: stripHtml(rawCourses[index].description) || rawCourses[index].description || "",
        category: rawCourses[index].category,
        categoryLabel: rawCourses[index].categoryLabel,
        image: rawCourses[index].image,
        price: rawCourses[index].price,
        originalPrice: rawCourses[index].originalPrice,
        availability: rawCourses[index].availability,
        tags: rawCourses[index].tags,
      }
    }

    return rawCourses[index]
  },
  async delete(id: number): Promise<boolean> {
    await delay(200)
    const index = rawCourses.findIndex((course) => course.id === id)
    if (index === -1) return false

    rawCourses.splice(index, 1)
    const previewIndex = coursesStore.findIndex((course) => course.id === id)
    if (previewIndex !== -1) {
      coursesStore.splice(previewIndex, 1)
    }

    return true
  },
}
