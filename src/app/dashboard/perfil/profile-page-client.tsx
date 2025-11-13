'use client'

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ImageUpload } from "@/components/ui/image-upload"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { PerfilUsuario } from "@/services/auth/auth-service"
import { toast } from "sonner"

const PERFIL_LABEL: Record<PerfilUsuario, string> = {
  [PerfilUsuario.Admin]: "Administrador",
  [PerfilUsuario.Secretaria]: "Secretaria",
  [PerfilUsuario.Professor]: "Professor",
  [PerfilUsuario.Aluno]: "Aluno",
}

const PERFIL_OPTIONS: PerfilUsuario[] = [
  PerfilUsuario.Admin,
  PerfilUsuario.Secretaria,
  PerfilUsuario.Professor,
  PerfilUsuario.Aluno,
]

const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Informe seu nome")
    .max(120, "O nome pode ter no máximo 120 caracteres"),
  displayName: z.string().max(80, "Máximo de 80 caracteres").optional(),
  avatarPublic: z.string().optional(),
  bio: z.string().max(280, "A bio pode ter no máximo 280 caracteres").optional(),
  perfil: z.nativeEnum(PerfilUsuario).optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfilePageClient() {
  const { user, loading, refresh } = useAuth()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const currentPerfil = user?.perfil ?? PerfilUsuario.Secretaria

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      displayName: "",
      avatarPublic: "",
      bio: "",
      perfil: PerfilUsuario.Secretaria,
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? "",
        displayName: user.displayName ?? "",
        avatarPublic: user.avatarPublic ?? user.avatarUrl ?? "",
        bio: user.bio ?? "",
        perfil: currentPerfil,
      })
    }
  }, [user, form, currentPerfil])

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setUploading(true)

      const payload: Record<string, unknown> = {
        name: values.name.trim(),
        displayName: values.displayName?.trim() ?? "",
        bio: values.bio?.trim() ?? "",
        perfil: currentPerfil,
      }

      const avatarValue = values.avatarPublic?.trim() ?? ""
      if (avatarValue.length > 0) {
        if (avatarValue.startsWith("data:image/")) {
          payload.avatarDataUrl = avatarValue
        } else {
          payload.avatarUrl = avatarValue
        }
      } else {
        payload.avatarUrl = ""
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const result = (await response.json()) as {
        success?: boolean
        message?: string
        user?: {
          name?: string
          displayName?: string | null
          avatarUrl?: string | null
          bio?: string | null
        }
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Não foi possível atualizar o perfil.")
      }

      toast.success("Perfil atualizado com sucesso!")

      if (result.user?.avatarUrl) {
        form.setValue("avatarPublic", result.user.avatarUrl, {
          shouldDirty: false,
        })
      }

      await refresh()
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil."
      )
    } finally {
      setUploading(false)
    }
  })

  if (loading && !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Perfil indisponível</CardTitle>
            <CardDescription>
              Você precisa estar autenticado para alterar seu perfil.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const avatarPreview = form.watch("avatarPublic")
  const namePreview = form.watch("displayName") || form.watch("name")
  const userPerfilLabel = currentPerfil

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Meu perfil</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Atualize suas informações pessoais utilizadas no dashboard.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Coluna lateral - Preview do perfil */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    Como seu perfil será exibido
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative h-32 w-32 overflow-hidden rounded-full bg-muted ring-4 ring-background">
                      {avatarPreview ? (
                        <Image
                          src={avatarPreview}
                          alt={namePreview}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground">
                          {(namePreview || user.name)
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-center space-y-1">
                      <p className="font-semibold text-lg">{namePreview}</p>
                      <p className="text-sm text-muted-foreground">{PERFIL_LABEL[userPerfilLabel]}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {form.watch("bio") && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground italic">
                        "{form.watch("bio")}"
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna principal - Formulário */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações pessoais</CardTitle>
                  <CardDescription>
                    Dados básicos exibidos no dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome de exibição</FormLabel>
                          <FormControl>
                            <Input placeholder="Como prefere ser chamado" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FormLabel>Email</FormLabel>
                      <Input value={user.email} disabled readOnly />
                    </div>
                    <div className="space-y-2">
                      <FormLabel>Perfil</FormLabel>
                      <Input value={PERFIL_LABEL[userPerfilLabel]} disabled readOnly />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Conte um pouco sobre você (opcional)"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Foto do perfil</CardTitle>
                  <CardDescription>
                    Sua foto é exibida no dashboard e comunicações internas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="avatarPublic"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload
                            value={field.value ?? ""}
                            onChange={(value) => field.onChange(value ?? "")}
                            previewClassName="h-40 w-full"
                            disabled={uploading || form.formState.isSubmitting}
                            description="Arraste uma imagem ou clique para enviar. Também é possível colar uma URL pública."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={form.formState.isSubmitting || uploading}
                  className="min-w-[200px]"
                >
                  {form.formState.isSubmitting || uploading
                    ? "Salvando..."
                    : "Salvar alterações"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
