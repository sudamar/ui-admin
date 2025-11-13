'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { CourseForm } from "@/features/courses/components/course-form"
import { cursosService, type CourseDetails, type Curso } from "@/services/cursos/cursos-service"

function recordToArray(value?: Record<string, unknown> | string[] | string | null): string[] | undefined {
  if (!value) return undefined
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item ?? "")))
      .filter((item) => item && item.trim().length > 0)
    return normalized.length ? normalized : undefined
  }
  if (typeof value === "object") {
    const normalized = Object.values(value as Record<string, unknown>)
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item ?? "")))
      .filter((item) => item && item.trim().length > 0)
    return normalized.length ? normalized : undefined
  }
  if (typeof value === "string") {
    const trimmed = value.trim()
    return trimmed ? [trimmed] : undefined
  }
  return undefined
}

function toCourseDetails(curso: Curso | null): CourseDetails | null {
  if (!curso) return null
  const { fullDescription, justificativa, objetivos, publico, ...rest } = curso
  return {
    ...rest,
    fullDescription: recordToArray(fullDescription as any),
    justificativa: recordToArray(justificativa as any),
    objetivos: recordToArray(objetivos as any),
    publico: recordToArray(publico as any),
  }
}

export default function EditCoursePage() {
  const params = useParams<{ id: string }>()
  const courseId = params?.id
  const [course, setCourse] = useState<CourseDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseId) return

    const load = async () => {
      setLoading(true)
      const data = await cursosService.getById(courseId)
      setCourse(toCourseDetails(data))
      setLoading(false)
    }

    void load()
  }, [courseId])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[640px] w-full" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="rounded-md border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
        Curso não encontrado.
      </div>
    )
  }

  return (
    <CourseForm
      mode="edit"
      initialData={course}
      onDelete={async () => {
        return cursosService.delete(course.id)
      }}
    />
  )
}
