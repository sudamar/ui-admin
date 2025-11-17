import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { NovosCursosTable } from "@/features/cursos/components/novos-cursos-table"

export const metadata: Metadata = {
  title: "Cursos FAFIH",
  description: "Gerencie cursos utilizando a nova experiência de edição.",
}

export default function NovosCursosPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Cursos Fafih</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Lista de cursos com ações focadas em conteúdo, mídia e valores.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto md:flex-row">
          <Button asChild className="w-full md:w-auto">
            <Link href="/dashboard/cursos/novo" className="inline-flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Novo curso
            </Link>
          </Button>
        </div>
      </div>

      <NovosCursosTable />
    </div>
  )
}
