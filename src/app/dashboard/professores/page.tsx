import type { Metadata } from "next"
import Link from "next/link"
import { UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProfessoresTable } from "@/features/professores/components/professores-table"

export const metadata: Metadata = {
  title: "Professores",
  description: "Gerencie o corpo docente da FAFIH.",
}

export default function ProfessoresPage() {
  return (
    <div className="flex-1 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Professores</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Visualize, consulte e gerencie o corpo docente da FAFIH.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/professores/novo">
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Professor
          </Link>
        </Button>
      </div>

      <ProfessoresTable />
    </div>
  )
}
