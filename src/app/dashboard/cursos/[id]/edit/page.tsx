'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { CourseForm } from "@/features/courses/components/course-form"
import { cursosService, type CourseDetails } from "@/services/cursos/cursos-service"

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
      setCourse(data ?? null)
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
