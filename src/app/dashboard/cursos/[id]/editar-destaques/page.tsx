import type { Metadata } from "next"
import { AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: "Editar destaques",
}

export default function EditarDestaquesPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Editar destaques</h1>
      <p className="text-sm text-muted-foreground">
        Página temporária para o curso com ID <span className="font-medium text-foreground">{params.id}</span>.
      </p>
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/60 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold text-amber-900">Página em construção</p>
          <p>
            O módulo de destaques está em desenvolvimento. Em breve você poderá configurar os cards desta seção por aqui.
          </p>
        </div>
      </div>
    </div>
  )
}
