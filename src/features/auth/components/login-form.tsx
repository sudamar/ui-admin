'use client'

import { useCallback, useEffect, useId, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe o email.")
    .email("Informe um email válido."),
  password: z
    .string()
    .min(1, "Informe a senha.")
    .min(6, "A senha precisa ter ao menos 6 caracteres."),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter()
  const { refresh } = useAuth()
  const [turnstileToken, setTurnstileToken] = useState("")
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA"
  const callbackName = useId().replace(/:/g, "_")

  useEffect(() => {
    if (typeof window === "undefined") return
    ;(window as typeof window & { [key: string]: (token: string) => void })[
      callbackName
    ] = (token: string) => {
      setTurnstileToken(token)
    }
    return () => {
      if (typeof window === "undefined") return
      delete (window as typeof window & { [key: string]: unknown })[callbackName]
    }
  }, [callbackName])

  const resetTurnstile = () => {
    if (typeof window === "undefined") return
    try {
      ;(window as typeof window & { turnstile?: { reset: () => void } }).turnstile?.reset()
    } catch {
      // ignore reset errors
    }
    setTurnstileToken("")
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "sudamar@me.com",
      password: "",
    },
  })

  const onSubmit = useCallback(
    async (values: LoginFormValues) => {
      try {
        if (!turnstileToken) {
          toast.error("Confirme que você não é um robô antes de continuar.")
          return
        }
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ ...values, turnstileToken }),
        })

        const result = (await response.json()) as {
          success?: boolean
          message?: string
        }

        if (!response.ok || !result?.success) {
          toast.error(result?.message ?? "Não foi possível realizar o login.")
          return
        }

        toast.success("Login realizado com sucesso!")
        await refresh()

        try {
          router.replace("/dashboard")
          router.refresh()
        } catch {
          if (typeof window !== "undefined") {
            window.location.href = "/dashboard"
          }
        }
      } catch (error) {
        console.error("Erro ao realizar login", error)
        toast.error("Ocorreu um erro inesperado. Tente novamente.")
      } finally {
        resetTurnstile()
      }
    },
    [refresh, router, turnstileToken]
  )

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Acesse sua conta</CardTitle>
          <CardDescription>
            Entre com seu email para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handleSubmit(onSubmit)(event)
            }}
            noValidate
          >
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={!!errors.email}
                />
                {errors.email ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                  <a
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Esqueceu sua senha?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register("password")}
                  aria-invalid={!!errors.password}
                />
                {errors.password ? (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </Button>
              <div className="flex w-full justify-center">
                <div
                  className="cf-turnstile"
                  data-sitekey={siteKey}
                  data-callback={callbackName}
                  data-action="login"
                  data-reset="auto"
                  data-theme="light"
                />
              </div>
              {/* <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
              >
                Entrar com Google
              </Button> */}
            </div>
            {/* <div className="mt-4 text-center text-sm">
              Não tem uma conta?{" "}
              <a href="#" className="underline underline-offset-4">
                Cadastre-se
              </a>
            </div> */}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
import { Loader2 } from "lucide-react"
