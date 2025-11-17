"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  COURSE_CATEGORY_LABEL_MAP,
  COURSE_CATEGORY_OPTIONS,
} from "@/features/cursos/constants/course-categories"

export const EMPTY_CATEGORY_VALUE = "__none__"

interface SelectCategoriaCursoProps {
  value?: string | null
  onChange: (value: { categoria: string; rotulo: string } | null) => void
  placeholder?: string
  className?: string
  triggerClassName?: string
}

export function SelectCategoriaCurso({
  value,
  onChange,
  placeholder = "Selecione a categoria",
  className,
  triggerClassName,
}: SelectCategoriaCursoProps) {
  return (
    <Select
      value={value && value.length > 0 ? value : EMPTY_CATEGORY_VALUE}
      onValueChange={(selected) => {
        if (selected === EMPTY_CATEGORY_VALUE) {
          onChange(null)
          return
        }
        onChange({
          categoria: selected,
          rotulo: COURSE_CATEGORY_LABEL_MAP[selected] ?? "",
        })
      }}
    >
      <SelectTrigger id="category" className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={className}>
        <SelectItem value={EMPTY_CATEGORY_VALUE}>Sem categoria</SelectItem>
        {COURSE_CATEGORY_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
