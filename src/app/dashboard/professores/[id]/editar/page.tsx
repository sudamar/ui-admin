import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { EditProfessorForm } from "@/features/professores/components/edit-professor-form"
import { getProfessores } from "@/features/professores/data"

type PageParams = {
  id: string
}

type Resolvable<T> = T | Promise<T>

type PageProps = {
  params: Resolvable<PageParams>
}

const professores = getProfessores()

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const { id } = await params
  const professor = professores.find(
    (item) => item.id === Number(id)
  )

  if (!professor) {
    return {
      title: "Professor não encontrado",
    }
  }

  return {
    title: `Editar ${professor.nome}`,
    description: `Atualize os dados do professor ${professor.nome}.`,
  }
}

export default async function EditProfessorPage({ params }: PageProps) {
  const { id } = await params
  const numericId = Number(id)
  const professor = professores.find((item) => item.id === numericId)

  if (!Number.isFinite(numericId) || !professor) {
    notFound()
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Editar professor
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Atualize os dados do professor selecionado.
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

      <EditProfessorForm professor={professor} />
    </div>
  )
}
