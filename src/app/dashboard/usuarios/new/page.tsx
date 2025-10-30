"use client"

import { useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import * as z from "zod"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowLeft, Camera, Save } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PerfilUsuario } from "@/services/auth/auth-service"
import { toast } from "sonner"

const PERFIL_LABEL: Record<PerfilUsuario, string> = {
  [PerfilUsuario.Admin]: "Administrador",
  [PerfilUsuario.Secretaria]: "Secretaria",
  [PerfilUsuario.Professor]: "Professor",
  [PerfilUsuario.Aluno]: "Aluno",
}

const userSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z
    .string()
    .min(8, { message: "A senha deve ter pelo menos 8 caracteres." })
    .max(72, { message: "A senha pode ter no máximo 72 caracteres." }),
  perfil: z.nativeEnum(PerfilUsuario),
  status: z.enum(["active", "inactive"]),
})

type UserFormData = z.infer<typeof userSchema>

export default function NewUserPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<UserFormData>>({
    status: "active",
    perfil: PerfilUsuario.Secretaria,
    password: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({})
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const validate = (): UserFormData | null => {
    try {
      const parsed = userSchema.parse(formData)
      setErrors({})
      return parsed
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof UserFormData, string>> = {}
        error.issues.forEach((issue) => {
          const field = issue.path[0]
          if (field) {
            newErrors[field as keyof UserFormData] = issue.message
          }
        })
        setErrors(newErrors)
      }
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedData = validate()
    if (!parsedData) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...parsedData,
          avatarDataUrl: avatarDataUrl ?? undefined,
        }),
      })

      const result = (await response.json()) as {
        success?: boolean
        message?: string
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Não foi possível criar o usuário.")
      }

      toast.success("Usuário convidado com sucesso!")
      router.push("/dashboard/usuarios")
    } catch (error) {
      console.error("Erro ao criar usuário:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o usuário."
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: field === "perfil" ? (value as PerfilUsuario) : value,
    }))
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.")
      event.target.value = ""
      return
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("A imagem deve ter no máximo 5MB.")
      event.target.value = ""
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === "string") {
        setAvatarPreview(result)
        setAvatarDataUrl(result)
      } else {
        toast.error("Não foi possível ler o arquivo selecionado.")
      }
    }
    reader.onerror = () => {
      toast.error("Não foi possível carregar a imagem. Tente novamente.")
    }

    reader.readAsDataURL(file)

    // Permite selecionar o mesmo arquivo novamente, se necessário
    event.target.value = ""
  }

  const isAdmin = Boolean(
    user &&
      (user.perfil === PerfilUsuario.Admin || user.role === "admin")
  )

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>
              Apenas administradores podem criar novos usuários.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Solicite a um administrador que realize esta ação ou ajuste suas permissões.
            </p>
          </CardContent>
          <CardFooter className="pt-0">
            <Button onClick={() => router.push("/dashboard/usuarios")}>Voltar para lista</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/usuarios">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Novo Usuário</h1>
              <p className="text-muted-foreground">
                Adicione um novo usuário ao sistema
              </p>
            </div>
          </div>
        </div>
      </div>

      <Alert className="border-primary/20 bg-primary/5">
        <AlertTitle>Regra de acesso</AlertTitle>
        <AlertDescription>
          Só administradores podem convidar ou criar usuários neste painel.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Visualização do usuário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={handleAvatarClick}
                className="group relative h-24 w-24"
              >
                <Avatar className="h-full w-full border-2 border-dashed border-primary/40 transition-colors group-hover:border-primary">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Pré-visualização do avatar" />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                    {formData.name ? getInitials(formData.name) : "?"}
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
                onChange={handleAvatarChange}
                className="hidden"
              />
              <p className="text-center text-xs text-muted-foreground">
                Clique na foto para fazer upload (máx. 5MB).
              </p>
              <div className="text-center">
                <h3 className="font-semibold text-lg">
                  {formData.name || "Nome do usuário"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formData.email || "email@exemplo.com"}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                    {formData.perfil ? PERFIL_LABEL[formData.perfil] : "Perfil"}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      formData.status === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {formData.status === "active" ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações do Usuário</CardTitle>
            <CardDescription>
              Preencha os dados do novo usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nome completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="João Silva"
                    value={formData.name || ""}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    E-mail <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="joao@exemplo.com"
                    value={formData.email || ""}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="password">
                    Senha temporária <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Defina uma senha inicial"
                    value={formData.password || ""}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className={errors.password ? "border-destructive" : ""}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Informe uma senha provisória com no mínimo 8 caracteres. O usuário poderá alterá-la depois.
                  </p>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perfil">
                    Perfil <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.perfil}
                    onValueChange={(value) => handleChange("perfil", value)}
                  >
                    <SelectTrigger className={errors.perfil ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PerfilUsuario.Admin}>{PerfilUsuario.Admin}</SelectItem>
                      <SelectItem value={PerfilUsuario.Secretaria}>{PerfilUsuario.Secretaria}</SelectItem>
                      <SelectItem value={PerfilUsuario.Professor}>{PerfilUsuario.Professor}</SelectItem>
                      <SelectItem value={PerfilUsuario.Aluno}>{PerfilUsuario.Aluno}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.perfil && (
                    <p className="text-sm text-destructive">{errors.perfil}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">
                    Status <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange("status", value)}
                  >
                    <SelectTrigger className={errors.status ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-sm text-destructive">{errors.status}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Usuário
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  disabled={loading}
                >
                  <Link href="/dashboard/usuarios">Cancelar</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
