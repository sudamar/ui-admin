import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProfessorForm } from "@/features/professores/components/edit-professor-form"

export const metadata: Metadata = {
  title: "Novo professor",
  description: "Cadastre um novo professor na plataforma.",
}

export default function NovoProfessorPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Novo professor
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Preencha as informações abaixo para cadastrar um novo professor.
            </p>
          </div>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/dashboard/professores">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para lista
            </Link>
          </Button>
        </div>
        <Button asChild variant="outline" className="sm:hidden">
          <Link href="/dashboard/professores">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista
          </Link>
        </Button>
      </div>

      <ProfessorForm />
    </div>
  )
}
