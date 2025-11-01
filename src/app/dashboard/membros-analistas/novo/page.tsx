import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MembroAnalistaForm } from "@/features/membros-analistas/components/edit-membro-analista-form"

export const metadata: Metadata = {
  title: "Novo membro analista",
  description: "Cadastre um novo membro analista na plataforma.",
}

export default function NovoMembroAnalistaPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Novo membro analista
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Preencha as informações abaixo para cadastrar um novo membro analista.
            </p>
          </div>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/dashboard/membros-analistas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para lista
            </Link>
          </Button>
        </div>
        <Button asChild variant="outline" className="sm:hidden">
          <Link href="/dashboard/membros-analistas">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para lista
          </Link>
        </Button>
      </div>

      <MembroAnalistaForm />
    </div>
  )
}
