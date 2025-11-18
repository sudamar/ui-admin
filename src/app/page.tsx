import Image from "next/image"
import Link from "next/link"
import { ArrowRight, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="relative flex w-full max-w-5xl flex-col items-center gap-10 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full overflow-hidden rounded-2xl bg-muted/40 shadow-lg ring-1 ring-black/5 md:w-1/2 aspect-[500/380]">
          <Image
            src="/logo-fafih-horizontal.jpeg"
            alt="Logotipo FAFIH"
            fill
            priority
            className="object-contain"
          />
        </div>
        <div className="max-w-2xl text-center md:w-1/2 md:text-left">
          <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl">
            Gestão e Organização interna da FAFIH 
          </h1>
          <p className="mt-4 text-balance text-lg text-muted-foreground">
            Acesse o painel administrativo para acompanhar indicadores, gerenciar professores, cursos, 
            trabalhos e configurações da Faculdade.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row md:items-start">
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
        </div>
      </div>
    </main>
  )
}
