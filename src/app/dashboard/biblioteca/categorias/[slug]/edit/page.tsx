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
  label: z.string().min(2, "Informe o nome da categoria."),
  slug: z.string().optional(),
  icon: z.string().optional(),
  className: z.string().min(2, "Informe as classes de estilo."),
})

type CategoriaFormData = z.infer<typeof categoriaSchema>

type FormErrors = Partial<Record<keyof CategoriaFormData, string>>

const getIconComponent = (icon?: string): LucideIcon => {
  if (!icon) return Tag
  const IconComponent = Icons[icon as keyof typeof Icons] as LucideIcon | undefined
  return IconComponent ?? Tag
}

export default function EditarCategoriaPage() {
  const params = useParams<{ slug: string }>()
  const router = useRouter()
  const slug = params.slug

  const [formData, setFormData] = useState<CategoriaFormData | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const IconPreview = useMemo(() => getIconComponent(formData?.icon), [formData?.icon])

  useEffect(() => {
    const loadCategoria = async () => {
      try {
        const categoria = await categoriasService.getBySlug(slug)
        if (!categoria) {
          router.push("/dashboard/biblioteca/categorias")
          return
        }
        setFormData({
          label: categoria.label,
          slug: categoria.slug,
          icon: categoria.icon,
          className: categoria.className,
        })
      } catch (error) {
        console.error("Erro ao carregar categoria", error)
      } finally {
        setLoading(false)
      }
    }

    void loadCategoria()
  }, [router, slug])

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
        label: formData.label.trim(),
        slug: formData.slug?.trim() || undefined,
        icon: formData.icon?.trim() || undefined,
        className: formData.className.trim(),
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
      await categoriasService.update(slug, {
        slug: parsed.slug ?? "",
        label: parsed.label,
        icon: parsed.icon,
        className: parsed.className,
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
            <Badge variant="outline" className={`${formData.className} gap-1 text-base`}>
              <IconPreview className="h-4 w-4" />
              {formData.label || "Nome da categoria"}
            </Badge>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Slug atual: </span>
                {formData.slug?.trim() || slug}
              </p>
              <p>
                <span className="font-medium text-foreground">Ícone: </span>
                {formData.icon?.trim() || "Tag"}
              </p>
              <p className="flex items-start gap-1">
                <Palette className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="break-words">{formData.className || "Classes de cor padrão"}</span>
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
                <Label htmlFor="label">
                  Nome da categoria <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="label"
                  placeholder="Ex: Psicologia Analítica"
                  value={formData.label}
                  onChange={(event) => handleChange("label", event.target.value)}
                  className={errors.label ? "border-destructive" : ""}
                />
                {errors.label ? <p className="text-sm text-destructive">{errors.label}</p> : null}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (opcional)</Label>
                  <Input
                    id="slug"
                    placeholder="ex: psicologia-analitica"
                    value={formData.slug ?? ""}
                    onChange={(event) => handleChange("slug", event.target.value)}
                    className={errors.slug ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se vazio, manteremos o slug atual ou recalcularemos a partir do nome.
                  </p>
                  {errors.slug ? <p className="text-sm text-destructive">{errors.slug}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Ícone (opcional)</Label>
                  <Input
                    id="icon"
                    placeholder="Ex: Sparkles"
                    value={formData.icon ?? ""}
                    onChange={(event) => handleChange("icon", event.target.value)}
                    className={errors.icon ? "border-destructive" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Utilize o nome do ícone do Lucide (ex: Sparkles, HeartHandshake).
                  </p>
                  {errors.icon ? <p className="text-sm text-destructive">{errors.icon}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="className">
                  Classes de estilo <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="className"
                  placeholder="border-slate-200 bg-slate-50 text-slate-700"
                  value={formData.className}
                  onChange={(event) => handleChange("className", event.target.value)}
                  className={`min-h-[90px] ${errors.className ? "border-destructive" : ""}`}
                />
                <p className="text-xs text-muted-foreground">
                  Combine classes utilitárias do Tailwind para personalizar a cor do selo.
                </p>
                {errors.className ? <p className="text-sm text-destructive">{errors.className}</p> : null}
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
