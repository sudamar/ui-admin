'use client'

import { CourseForm } from "@/features/courses/components/course-form"

export default function NewCoursePage() {
  return (
    <div className="flex-1 space-y-4 md:space-y-6">
      <CourseForm mode="create" />
    </div>
  )
}
