import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Editar mídias",
}

export default function EditarMidiasPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Editar mídias</h1>
      <p className="text-sm text-muted-foreground">
        Página temporária para o curso com ID <span className="font-medium text-foreground">{params.id}</span>.
      </p>
    </div>
  )
}
