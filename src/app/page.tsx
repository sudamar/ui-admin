import Link from "next/link"
import { ArrowRight, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="max-w-2xl text-center">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-medium text-muted-foreground">
          <ArrowRight className="size-4" />
          Plataforma Wow Fafih
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
          Organize a sua gestão acadêmica em um só lugar
        </h1>
        <p className="mt-4 text-balance text-lg text-muted-foreground">
          Acesse o painel administrativo para acompanhar indicadores, gerenciar usuários e
          acelerar decisões estratégicas da instituição.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="gap-2">
          <Link href="/login">
            <LogIn className="size-4" />
            Fazer login
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/dashboard">
            Acessar dashboard
          </Link>
        </Button>
      </div>
    </main>
  )
}
