'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Compass, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function NotFound() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border border-border/80 shadow-sm">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="size-6" />
          </div>
          <CardTitle className="text-xl font-semibold">Página não encontrada</CardTitle>
          <CardDescription>
            O endereço acessado não existe ou foi movido. Escolha uma das opções abaixo para continuar.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="size-4" />
              Voltar ao início
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Ir para o dashboard</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Voltar à página anterior
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
