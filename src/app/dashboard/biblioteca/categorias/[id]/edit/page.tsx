"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import * as Icons from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Save, Tag, Palette, type LucideIcon } from "lucide-react"

import { categoriasService } from "@/services/trabalhos/categorias-service"

const categoriaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da categoria."),
  icone: z
    .string()
    .trim()
    .max(100, "Nome do ícone muito longo.")
    .optional()
    .or(z.literal("")),
  cor: z
    .string()
    .trim()
    .max(120, "Valor de cor muito longo.")
    .optional()
    .or(z.literal("")),
})

type CategoriaFormData = z.infer<typeof categoriaSchema>

type FormErrors = Partial<Record<keyof CategoriaFormData, string>>

const getIconComponent = (icon?: string): LucideIcon => {
  if (!icon) return Tag
  const IconComponent = Icons[icon as keyof typeof Icons] as LucideIcon | undefined
  return IconComponent ?? Tag
}

export default function EditarCategoriaPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [formData, setFormData] = useState<CategoriaFormData | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const IconPreview = useMemo(() => getIconComponent(formData?.icone), [formData?.icone])

  useEffect(() => {
    const loadCategoria = async () => {
      try {
        const categoria = await categoriasService.getById(id)
        if (!categoria) {
          router.push("/dashboard/biblioteca/categorias")
          return
        }
        setFormData({
          nome: categoria.nome,
          icone: categoria.icone ?? "",
          cor: categoria.cor ?? "",
        })
      } catch (error) {
        console.error("Erro ao carregar categoria", error)
      } finally {
        setLoading(false)
      }
    }

    void loadCategoria()
  }, [id, router])

  const handleChange = (field: keyof CategoriaFormData, value: string) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validate = () => {
    if (!formData) return null
    try {
      const parsed = categoriaSchema.parse({
        nome: formData.nome.trim(),
        icone: formData.icone?.trim() ?? undefined,
        cor: formData.cor?.trim() ?? undefined,
      })
      setErrors({})
      return parsed
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: FormErrors = {}
        error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof CategoriaFormData
          fieldErrors[field] = issue.message
        })
        setErrors(fieldErrors)
      }
      return null
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = validate()
    if (!parsed) return

    setSaving(true)
    try {
      await categoriasService.update(id, {
        nome: parsed.nome,
        icone: parsed.icone?.length ? parsed.icone : undefined,
        cor: parsed.cor?.length ? parsed.cor : undefined,
      })
      router.push("/dashboard/biblioteca/categorias")
    } catch (error) {
      console.error("Erro ao atualizar categoria", error)
      alert("Não foi possível atualizar a categoria. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !formData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">Carregando categoria...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/biblioteca/categorias">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar categoria</h1>
          <p className="text-muted-foreground">Atualize as informações da categoria selecionada.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Visualização da categoria nos trabalhos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Badge
              variant="outline"
              className={`${formData.cor || "border-slate-200 bg-slate-50 text-slate-700"} gap-1 text-base`}
            >
              <IconPreview className="h-4 w-4" />
              {formData.nome || "Nome da categoria"}
            </Badge>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Ícone: </span>
                {formData.icone?.trim() || "Tag"}
              </p>
              <p className="flex items-start gap-1">
                <Palette className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="break-words">{formData.cor || "Classes de cor padrão"}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Dados da categoria</CardTitle>
              <CardDescription>Edite as informações conforme necessário.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome da categoria <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex: Psicologia Analítica"
                  value={formData.nome}
                  onChange={(event) => handleChange("nome", event.target.value)}
                  className={errors.nome ? "border-destructive" : ""}
                />
                {errors.nome ? <p className="text-sm text-destructive">{errors.nome}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="icone">Ícone (opcional)</Label>
                <Input
                  id="icone"
                  placeholder="Ex: Sparkles"
                  value={formData.icone ?? ""}
                  onChange={(event) => handleChange("icone", event.target.value)}
                  className={errors.icone ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Utilize o nome do ícone do Lucide (ex: Sparkles, HeartHandshake).
                </p>
                {errors.icone ? <p className="text-sm text-destructive">{errors.icone}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cor">Classes de estilo</Label>
                <Textarea
                  id="cor"
                  placeholder="Ex: border-blue-200 bg-blue-50 text-blue-700"
                  value={formData.cor ?? ""}
                  onChange={(event) => handleChange("cor", event.target.value)}
                  className={errors.cor ? "border-destructive" : ""}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Informe as classes utilitárias (Tailwind) que definem as cores do badge.
                </p>
                {errors.cor ? <p className="text-sm text-destructive">{errors.cor}</p> : null}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/dashboard/biblioteca/categorias">Cancelar</Link>
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
