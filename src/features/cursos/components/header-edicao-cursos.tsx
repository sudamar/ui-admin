import Image from "next/image"
import { Folder } from "lucide-react"

interface HeaderEdicaoCursosProps {
  title: string
  category?: string | null
  imageUrl?: string | null
}

export function HeaderEdicaoCursos({ title, category, imageUrl }: HeaderEdicaoCursosProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border bg-card/60 p-4 shadow-sm md:flex-row md:items-center">
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <div className="relative h-16 w-16 overflow-hidden rounded-xl border bg-muted">
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="64px"
              className="object-cover"
              priority
            />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-muted text-muted-foreground">
            <Folder className="h-6 w-6" />
          </div>
        )}
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Editando</p>
          <h1 className="text-xl font-semibold leading-tight md:text-2xl">{title}</h1>
          {category ? (
            <p className="text-sm text-muted-foreground">Categoria: <span className="font-medium text-foreground">{category}</span></p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
