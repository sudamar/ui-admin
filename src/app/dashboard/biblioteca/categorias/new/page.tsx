"use client"

import { useMemo, useState, type CSSProperties } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as Icons from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Save, Tag, Palette, HelpCircle, type LucideIcon } from "lucide-react"

import { categoriasService } from "@/services/trabalhos/categorias-service"
import { cn } from "@/lib/utils"

const tailwindPattern = /^[a-z0-9-:\s]+$/i
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const categoriaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe o nome da categoria."),
  slug: z
    .string()
    .trim()
    .min(2, "Informe o slug da categoria.")
    .max(100, "Slug muito longo.")
    .superRefine((value, ctx) => {
      if (value && !slugPattern.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use apenas letras minúsculas, números e hífens (ex: psicologia-analitica)",
        })
      }
    }),
  icone: z
    .string()
    .trim()
    .max(100, "Nome do ícone muito longo.")
    .optional()
    .or(z.literal(""))
    .superRefine((value, ctx) => {
      if (value && !tailwindPattern.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use apenas caracteres válidos (a-z, -, :)",
        })
      }
    }),
  cor: z
    .string()
    .trim()
    .max(120, "Valor de cor muito longo.")
    .optional()
    .or(z.literal(""))
    .superRefine((value, ctx) => {
      if (value && !tailwindPattern.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe apenas classes utilitárias válidas.",
        })
      }
    }),
})

type CategoriaFormData = z.infer<typeof categoriaSchema>

type FormErrors = Partial<Record<keyof CategoriaFormData, string>>

const getIconComponent = (icon?: string): LucideIcon => {
  if (!icon) return Tag
  const IconComponent = Icons[icon as keyof typeof Icons] as LucideIcon | undefined
  return IconComponent ?? Tag
}

const normalizeHex = (value: string) => {
  const hex = value.replace("#", "").trim()
  if (hex.length === 3) {
    return hex
      .split("")
      .map((char) => char + char)
      .join("")
  }
  return hex.padEnd(6, "0")
}

const getContrastColor = (hex: string) => {
  const normalized = normalizeHex(hex)
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#111827" : "#F8FAFC"
}

type BadgeAppearance = {
  badgeClass: string
  badgeStyle?: CSSProperties
  iconClass?: string
  iconStyle?: CSSProperties
  squareClass?: string
  squareStyle?: CSSProperties
}

const getAppearance = (cor?: string | null): BadgeAppearance => {
  const DEFAULT_BADGE = "border-slate-200 bg-slate-50 text-slate-700"
  const DEFAULT_SQUARE = "border-slate-200 bg-slate-50"

  if (!cor) {
    return {
      badgeClass: DEFAULT_BADGE,
      squareClass: DEFAULT_SQUARE,
    }
  }

  const trimmed = cor.trim()
  if (trimmed.startsWith("#")) {
    const textColor = getContrastColor(trimmed)
    return {
      badgeClass: "border border-transparent",
      badgeStyle: { backgroundColor: trimmed, color: textColor },
      iconStyle: { color: textColor },
      squareStyle: { backgroundColor: trimmed, borderColor: trimmed },
    }
  }

  const textClass = trimmed
    .split(/\s+/)
    .find((cls) => cls.startsWith("text-"))

  return {
    badgeClass: trimmed,
    iconClass: textClass,
    squareClass: trimmed,
  }
}

const isDuplicateColorError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message)
    return message.includes("categorias_trabalhos_cor_key") || message.includes("duplicate key value")
  }
  return false
}

const isDuplicateSlugError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message)
    return message.includes("categorias_trabalhos_slug_key") || (message.includes("duplicate key value") && message.includes("slug"))
  }
  return false
}

export default function NovaCategoriaPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<CategoriaFormData>({
    nome: "",
    slug: "",
    icone: "Tag",
    cor: "border-slate-200 bg-slate-50 text-slate-700",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  const IconPreview = useMemo(() => getIconComponent(formData.icone), [formData.icone])
  const previewAppearance = useMemo(() => getAppearance(formData.cor), [formData.cor])

  const handleChange = (field: keyof CategoriaFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleBlur = (field: keyof CategoriaFormData) => {
    setFormData((prev) => ({ ...prev, [field]: prev[field]?.trim() ?? "" }))
  }

  const validate = () => {
    try {
      const parsed = categoriaSchema.parse({
        nome: formData.nome.trim(),
        slug: formData.slug.trim(),
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

    setSubmitting(true)
    try {
      await categoriasService.create({
        nome: parsed.nome,
        slug: parsed.slug,
        icone: parsed.icone?.length ? parsed.icone : undefined,
        cor: parsed.cor?.length ? parsed.cor : undefined,
      })
      router.push("/dashboard/biblioteca/categorias")
    } catch (error) {
      console.error("Erro ao criar categoria", error)
      if (isDuplicateSlugError(error)) {
        setErrors({ slug: "Uma categoria já possui esse slug. Escolha outro." })
      } else if (isDuplicateColorError(error)) {
        setErrors({ cor: "Uma categoria já possui essa cor. Escolha outra." })
      } else {
        alert("Não foi possível criar a categoria. Tente novamente.")
      }
    } finally {
      setSubmitting(false)
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Nova categoria</h1>
          <p className="text-muted-foreground">Cadastre uma nova categoria para classificar os trabalhos.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Como a categoria será exibida nos trabalhos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={cn("inline-block h-6 w-6 rounded border", previewAppearance.squareClass)}
                style={previewAppearance.squareStyle}
              />
              <Badge
                variant="outline"
                className={cn("gap-1 text-base", previewAppearance.badgeClass)}
                style={previewAppearance.badgeStyle}
              >
                <IconPreview
                  className={cn("h-4 w-4", previewAppearance.iconClass)}
                  style={previewAppearance.iconStyle}
                />
                {formData.nome || "Nome da categoria"}
              </Badge>
            </div>
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
              <CardDescription>Preencha as informações da nova categoria.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome da categoria <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex: Psicologia Analítica"
                  value={formData.nome ?? ""}
                  onChange={(event) => handleChange("nome", event.target.value)}
                  onBlur={() => handleBlur("nome")}
                  className={errors.nome ? "border-destructive" : ""}
                />
                {errors.nome ? <p className="text-sm text-destructive">{errors.nome}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="slug"
                  placeholder="Ex: psicologia-analitica"
                  value={formData.slug ?? ""}
                  onChange={(event) => handleChange("slug", event.target.value)}
                  onBlur={() => handleBlur("slug")}
                  className={errors.slug ? "border-destructive" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  Identificador único usado em URLs. Use apenas letras minúsculas, números e hífens.
                </p>
                {errors.slug ? <p className="text-sm text-destructive">{errors.slug}</p> : null}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="icone">Ícone (opcional)</Label>
                  <a
                    href="https://lucide.dev/icons/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    Ver catálogo
                  </a>
                </div>
                <Input
                  id="icone"
                  placeholder="Ex: Sparkles"
                  value={formData.icone ?? ""}
                  onChange={(event) => handleChange("icone", event.target.value)}
                  onBlur={() => handleBlur("icone")}
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
                  onChange={(event) => {
                    const value = event.target.value
                    setFormData((prev) => ({ ...prev, cor: value }))
                    if (errors.cor) {
                      setErrors((prev) => ({ ...prev, cor: undefined }))
                    }
                  }}
                  onBlur={() => handleBlur("cor")}
                  className={errors.cor ? "border-destructive" : ""}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Informe as classes utilitárias (Tailwind) que definem as cores do badge.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span
                    className={cn("inline-block h-5 w-5 rounded border", previewAppearance.squareClass)}
                    aria-hidden="true"
                    style={previewAppearance.squareStyle}
                  />
                  Pré-visualização da cor
                </div>
                {errors.cor ? <p className="text-sm text-destructive">{errors.cor}</p> : null}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" className="w-full sm:w-auto" asChild>
                <Link href="/dashboard/biblioteca/categorias">Cancelar</Link>
              </Button>
              <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar categoria
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
