import type { Metadata } from "next"
import Link from "next/link"
import { UserPlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { MembrosAnalistasTable } from "@/features/membros-analistas/components/membros-analistas-table"

export const metadata: Metadata = {
  title: "Membros analistas",
  description: "Gerencie os membros analistas da FAFIH.",
}

export default function MembrosAnalistasPage() {
  return (
    <div className="flex-1 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Membros analistas</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Visualize, consulte e gerencie os membros analistas vinculados à FAFIH.
          </p>
        </div>
        <div className="w-full md:w-auto md:flex-none">
          <Button
            asChild
            className="w-full justify-center md:w-auto md:px-5"
          >
            <Link
              href="/dashboard/membros-analistas/novo"
              className="inline-flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Novo membro
            </Link>
          </Button>
        </div>
      </div>

      <MembrosAnalistasTable />
    </div>
  )
}
