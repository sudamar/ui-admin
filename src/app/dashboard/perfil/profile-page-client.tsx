'use client'

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Informe seu nome")
    .max(120, "O nome pode ter no máximo 120 caracteres"),
  displayName: z.string().max(80, "Máximo de 80 caracteres").optional(),
  avatarPublic: z
    .union([
      z
        .string()
        .url("Informe uma URL válida")
        .max(1024, "URL muito longa"),
      z.literal(""),
    ])
    .optional(),
  bio: z.string().max(280, "A bio pode ter no máximo 280 caracteres").optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function ProfilePageClient() {
  const { user, loading, refresh } = useAuth()

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      displayName: "",
      avatarPublic: "",
      bio: "",
    },
  })

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? "",
        displayName: user.displayName ?? "",
        avatarPublic: user.avatarPublic ?? user.avatarUrl ?? "",
        bio: user.bio ?? "",
      })
    }
  }, [user, form])

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          displayName: values.displayName,
          avatarUrl: values.avatarPublic,
          bio: values.bio,
        }),
      })

      const result = (await response.json()) as {
        success?: boolean
        message?: string
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Não foi possível atualizar o perfil.")
      }

      toast.success("Perfil atualizado com sucesso!")
      await refresh()
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil."
      )
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Meu perfil</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Atualize suas informações pessoais utilizadas no dashboard.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações básicas</CardTitle>
          <CardDescription>
            Seus dados são exibidos para outros administradores do sistema.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-full bg-muted">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt={namePreview}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                      {(namePreview || user.name)
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>A foto pública é exibida no dashboard e em comunicações internas.</p>
                  <p>Você pode enviar uma imagem ou informar uma URL pública existente.</p>
                </div>
              </div>

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

              <FormField
                control={form.control}
                name="avatarPublic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foto pública (URL)</FormLabel>
                    <FormControl>
                      <ImageUpload
                        value={field.value ?? ""}
                        onChange={(value) => field.onChange(value ?? "")}
                        className="max-w-sm"
                        previewClassName="h-32 w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Conte um pouco sobre você (opcional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>Email</p>
                <p className="font-medium text-foreground">{user.email}</p>
              </div>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  )
}
