"use client"

import { useEffect, useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { professoresService, type Professor } from "@/services/professores/professores-service"
import { cn } from "@/lib/utils"

const EMPTY_VALUE = "__none__"

interface SelectCoordenadorProps {
  value?: string | null
  onChange: (value: string | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function SelectCoordenador({
  value,
  onChange,
  placeholder = "Selecione um coordenador",
  className,
  disabled,
}: SelectCoordenadorProps) {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadProfessores = async () => {
      try {
        setLoading(true)
        const data = await professoresService.getAll()
        setProfessores(data)
      } catch (error) {
        console.error("Erro ao carregar professores", error)
      } finally {
        setLoading(false)
      }
    }

    void loadProfessores()
  }, [])

  return (
    <Select
      value={value ?? EMPTY_VALUE}
      onValueChange={(selected) => {
        if (selected === EMPTY_VALUE) {
          onChange(null)
          return
        }
        onChange(selected)
      }}
      disabled={disabled || loading}
    >
      <SelectTrigger className={cn("space-y-1", className)}>
        <SelectValue placeholder={loading ? "Carregando coordenadores..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={EMPTY_VALUE}>Sem coordenador</SelectItem>
        {professores.map((professor) => (
          <SelectItem key={professor.id} value={professor.id}>
            {professor.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
