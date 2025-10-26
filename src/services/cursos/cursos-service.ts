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

export interface Course {
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

const AVAILABILITY_SEQUENCE: CourseAvailability[] = [
  "promotion",
  "open",
  "limited",
  "sold-out",
]

function computeAvailability(index: number): CourseAvailability {
  return AVAILABILITY_SEQUENCE[index % AVAILABILITY_SEQUENCE.length]
}

function buildTags(course: Course): CourseTag[] {
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

const coursesStore: Course[] = cursosData.map((curso, index) => {
  const availability = computeAvailability(index)
  const course: Course = {
    id: curso.id,
    title: curso.title,
    description: curso.description ?? "",
    category: curso.category ?? "outros",
    categoryLabel: curso.categoryLabel,
    image: curso.image,
    price: curso.price,
    originalPrice: curso.originalPrice,
    availability,
    tags: [],
  }

  course.tags = buildTags(course)
  return course
})

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const coursesService = {
  async getAll(): Promise<Course[]> {
    await delay(200)
    return [...coursesStore]
  },
}
