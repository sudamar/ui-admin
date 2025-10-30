"use client"

import { useEffect, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ArrowLeft, Camera, Save } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PerfilUsuario } from "@/services/auth/auth-service"
import { compressImageFile } from "@/lib/image"
import { usersService } from "@/services/usuarios/usuario-service"
import { toast } from "sonner"

const PERFIL_LABEL: Record<PerfilUsuario, string> = {
  [PerfilUsuario.Admin]: "Administrador",
  [PerfilUsuario.Secretaria]: "Secretaria",
  [PerfilUsuario.Professor]: "Professor",
  [PerfilUsuario.Aluno]: "Aluno",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "O nome deve ter pelo menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor, insira um e-mail válido.",
  }),
  perfil: z.nativeEnum(PerfilUsuario),
  status: z.enum(["active", "inactive"]),
})

type FormData = z.infer<typeof formSchema>

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      perfil: PerfilUsuario.Secretaria,
      status: "active",
    },
  })
  const watchedName = form.watch("name")

  useEffect(() => {
    loadUser()
  }, [userId])

  const loadUser = async () => {
    setLoading(true)
    try {
      const user = userId ? await usersService.getById(userId) : null
      if (user) {
        form.reset({
          name: user.name,
          email: user.email,
          perfil: user.role,
          status: user.status,
        })
        setAvatarPreview(user.avatar ?? null)
        setAvatarDataUrl(null)
      } else {
        router.push("/dashboard/usuarios")
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const compressed = await compressImageFile(file, {
        maxSizeBytes: 1024 * 1024,
      })
      setAvatarPreview(compressed)
      setAvatarDataUrl(compressed)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível processar a imagem selecionada."
      toast.error(message)
    } finally {
      event.target.value = ""
    }
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      await usersService.update(userId, {
        ...data,
        perfil: data.perfil,
        avatarDataUrl: avatarDataUrl ?? undefined,
      })
      toast.success("Usuário atualizado com sucesso.")
      router.push("/dashboard/usuarios")
    } catch (error) {
      console.error("Erro ao salvar usuário:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o usuário."
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando usuário...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/usuarios">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Usuário</h1>
          <p className="text-muted-foreground">
            Atualize as informações do usuário
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Informações do Usuário</CardTitle>
                <CardDescription>
                  Preencha os campos abaixo para atualizar o usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    className="group relative h-24 w-24"
                  >
                    <Avatar className="h-full w-full border-2 border-dashed border-primary/40 transition-colors group-hover:border-primary">
                      {avatarPreview ? (
                        <AvatarImage
                          src={avatarPreview}
                          alt="Pré-visualização do avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                        {getInitials(watchedName || "") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 rounded-full bg-background/70 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="h-4 w-4" />
                      Trocar foto
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-center text-xs text-muted-foreground">
                    Clique na foto para enviar uma nova imagem (máx. 1MB).
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="João Silva" {...field} />
                      </FormControl>
                      <FormDescription>
                        Nome completo do usuário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="joao@fafih.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        E-mail para acesso ao sistema
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="perfil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Perfil</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um perfil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(PerfilUsuario).map((perfil) => (
                            <SelectItem key={perfil} value={perfil}>
                              {PERFIL_LABEL[perfil]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Nível de acesso do usuário no sistema
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Status atual do usuário
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/usuarios">Cancelar</Link>
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  )
}
