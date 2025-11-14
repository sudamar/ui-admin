"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RichTextEditorHybrid } from "@/components/shared/rich-text-editor-hybrid"
import { HeaderEdicaoCursos } from "@/features/novos-cursos/components/header-edicao-cursos"
import { cursosService, type Curso } from "@/services/cursos/cursos-service"
import { toast } from "sonner"

const toHtml = (value?: Record<string, unknown> | string[] | string | null) => {
  if (!value) return ""
  if (typeof value === "string") return value
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : JSON.stringify(item ?? "")))
      .filter(Boolean)
      .join("<br/><br/>")
  }
  const record = value as Record<string, unknown>
  if (typeof record.html === "string") {
    return record.html
  }

  return Object.values(record)
    .map((item) => (typeof item === "string" ? item : JSON.stringify(item ?? "")))
    .filter(Boolean)
    .join("<br/><br/>")
}

const normalizeHtmlValue = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export default function EditarConteudoPage() {
  const params = useParams<{ id: string }>()
  const courseId = params?.id
  const router = useRouter()
  const [course, setCourse] = useState<Curso | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [shortDescription, setShortDescription] = useState("")
  const [fullDescription, setFullDescription] = useState("")
  const [justificativa, setJustificativa] = useState("")
  const [objetivos, setObjetivos] = useState("")
  const [publico, setPublico] = useState("")
  const [investmentDetails, setInvestmentDetails] = useState("")
  const [additionalInfo, setAdditionalInfo] = useState("")

  useEffect(() => {
    if (!courseId) return

    const load = async () => {
      try {
        setLoading(true)
        const data = await cursosService.getById(courseId)
        if (data) {
          setCourse(data)
          setShortDescription(data.shortDescription ?? "")
          setFullDescription(toHtml(data.fullDescription))
          setJustificativa(toHtml(data.justificativa))
          setObjetivos(toHtml(data.objetivos))
          setPublico(toHtml(data.publico))
          setInvestmentDetails(toHtml(data.investmentDetails))
          setAdditionalInfo(toHtml(data.additionalInfo))
        }
      } catch (error) {
        console.error("Erro ao carregar curso", error)
        toast.error("Não foi possível carregar o curso.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [courseId])

  const isDirty = useMemo(() => {
    if (!course) return false
    return (
      shortDescription !== (course.shortDescription ?? "") ||
      fullDescription !== toHtml(course.fullDescription) ||
      justificativa !== toHtml(course.justificativa) ||
      objetivos !== toHtml(course.objetivos) ||
      publico !== toHtml(course.publico) ||
      investmentDetails !== toHtml(course.investmentDetails) ||
      additionalInfo !== toHtml(course.additionalInfo)
    )
  }, [course, shortDescription, fullDescription, justificativa, objetivos, publico, investmentDetails, additionalInfo])

  useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    const pushState = () => {
      window.history.pushState(null, "", window.location.href)
    }
    const handlePopState = () => {
      const shouldLeave = window.confirm("Existem alterações não salvas. Deseja realmente sair?")
      if (shouldLeave) {
        window.removeEventListener("beforeunload", handleBeforeUnload)
        window.removeEventListener("popstate", handlePopState)
        window.history.back()
      } else {
        pushState()
      }
    }
    pushState()
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isDirty])

  const handleSave = useCallback(async () => {
    if (!course) return

    try {
      setSaving(true)
      const payload: Curso = {
        ...course,
        shortDescription,
        fullDescription: normalizeHtmlValue(fullDescription),
        justificativa: normalizeHtmlValue(justificativa),
        objetivos: normalizeHtmlValue(objetivos),
        publico: normalizeHtmlValue(publico),
        investmentDetails: normalizeHtmlValue(investmentDetails),
        additionalInfo: normalizeHtmlValue(additionalInfo),
      }

      const updated = await cursosService.update(course.id, payload)
      setCourse(updated)
      toast.success("Conteúdo atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar conteúdo", error)
      const message = error instanceof Error ? error.message : "Não foi possível salvar."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }, [
    course,
    shortDescription,
    fullDescription,
    justificativa,
    objetivos,
    publico,
    investmentDetails,
    additionalInfo,
  ])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault()
        event.stopPropagation()
        void handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="rounded-md border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
        Curso não encontrado.
      </div>
    )
  }

  return (
    <>
      {saving ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Salvando alterações...</p>
        </div>
      ) : null}

      <div className="space-y-6">
        <Button
          asChild
          variant="ghost"
          className="inline-flex w-full items-center justify-center gap-2 border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/80 sm:w-auto"
        >
          <Link href="/dashboard/novos-cursos" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para lista de novos cursos
          </Link>
        </Button>

        <HeaderEdicaoCursos
          title={course.title}
          category={course.categoryLabel ?? course.category ?? "Não informado"}
          imageUrl={course.image_folder ?? course.imageUrl ?? null}
        />

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Edição de Conteúdo Textual</CardTitle>
              <p className="text-sm text-muted-foreground">Atualize os blocos descritivos usando o editor rico.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Descrição resumida</Label>
            <RichTextEditorHybrid
              value={shortDescription}
              onChange={(value) => setShortDescription(value)}
              placeholder="Escreva um resumo impactante..."
              minHeight="140px"
            />
          </div>

          {[
            { id: "fullDescription", label: "Descrição completa", state: fullDescription, setter: setFullDescription },
            { id: "justificativa", label: "Justificativa", state: justificativa, setter: setJustificativa },
            { id: "objetivos", label: "Objetivos", state: objetivos, setter: setObjetivos },
            { id: "publico", label: "Público alvo", state: publico, setter: setPublico },
            { id: "investmentDetails", label: "Detalhes de investimento", state: investmentDetails, setter: setInvestmentDetails },
            { id: "additionalInfo", label: "Informações adicionais", state: additionalInfo, setter: setAdditionalInfo },
          ].map((field) => (
            <div className="space-y-2" key={field.id}>
              <Label htmlFor={field.id}>{field.label}</Label>
              <RichTextEditorHybrid
                value={field.state}
                onChange={(value) => field.setter(value)}
                placeholder={`Informe o conteúdo de ${field.label.toLowerCase()}...`}
                minHeight="220px"
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (isDirty) {
                const shouldLeave = window.confirm("Existem alterações não salvas. Deseja descartar e voltar?")
                if (!shouldLeave) return
              }
              router.push("/dashboard/novos-cursos")
            }}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              "Salvar conteúdo"
            )}
          </Button>
        </CardFooter>
      </Card>
      </div>
    </>
  )
}
