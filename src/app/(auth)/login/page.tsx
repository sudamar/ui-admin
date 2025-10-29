import Image from "next/image"
import type { Metadata } from "next"

import { LoginForm } from "@/features/auth/components/login-form"

export const metadata: Metadata = {
  title: "Login",
  description: "Acesse o painel utilizando suas credenciais.",
}

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 px-6 py-10 md:px-10">
      <div className="flex w-full max-w-4xl flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo-fafih-horizontal.jpeg"
            alt="Logo da FAFIH"
            width={320}
            height={120}
            priority
            className="h-20 w-auto md:h-24"
          />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Bem-vindo ao portal FAFIH
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Utilize suas credenciais para acessar o painel administrativo.
            </p>
          </div>
        </div>
        <LoginForm className="w-full max-w-sm" />
      </div>
    </div>
  )
}
