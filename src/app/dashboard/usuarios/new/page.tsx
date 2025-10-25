"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Save, UserPlus } from "lucide-react"
import { usersService } from "@/services/usuarios/usuario-service"

const userSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  role: z.enum(["Admin", "Editor", "Viewer"], {
    required_error: "Por favor, selecione um perfil.",
  }),
  status: z.enum(["active", "inactive"], {
    required_error: "Por favor, selecione um status.",
  }),
})

type UserFormData = z.infer<typeof userSchema>

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<UserFormData>>({
    status: "active",
    role: "Viewer",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({})

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
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as keyof UserFormData] = err.message
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
      await usersService.create({
        name: parsedData.name,
        email: parsedData.email,
        role: parsedData.role,
        status: parsedData.status,
      })
      router.push("/dashboard/usuarios")
    } catch (error) {
      console.error("Erro ao criar usuário:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
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

      <div className="grid gap-6 md:grid-cols-3">
        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Visualização do usuário</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {formData.name ? getInitials(formData.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h3 className="font-semibold text-lg">
                  {formData.name || "Nome do usuário"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {formData.email || "email@exemplo.com"}
                </p>
                <div className="mt-2 flex items-center justify-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                    {formData.role || "Perfil"}
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

                <div className="space-y-2">
                  <Label htmlFor="role">
                    Perfil <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleChange("role", value)}
                  >
                    <SelectTrigger className={errors.role ? "border-destructive" : ""}>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Editor">Editor</SelectItem>
                      <SelectItem value="Viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role}</p>
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
