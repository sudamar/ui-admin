"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Loader2, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { HeaderEdicaoCursos } from "@/features/novos-cursos/components/header-edicao-cursos"
import {
  COURSE_CATEGORY_LABEL_MAP,
  COURSE_CATEGORY_OPTIONS,
} from "@/features/novos-cursos/constants/course-categories"
import { cursosService, type Curso } from "@/services/cursos/cursos-service"
import { SelectCoordenador } from "@/components/shared/select-coordenador"
import { toast } from "sonner"

const normalizeValue = (value: string) => value.trim()
const EMPTY_OPTION_VALUE = "__none__"
const BOOL_OPTION_TRUE = "true"
const BOOL_OPTION_FALSE = "false"

const parseBooleanFromUnknown = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true
    if (value.toLowerCase() === "false") return false
  }
  if (typeof value === "number") {
    if (value === 1) return true
    if (value === 0) return false
  }
  return null
}

export default function EditarDadosBasicosPage() {
  const params = useParams<{ id: string }>()
  const courseId = params?.id
  const router = useRouter()

  const [course, setCourse] = useState<Curso | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [category, setCategory] = useState("")
  const [categoryLabel, setCategoryLabel] = useState("")
  const [modalidade, setModalidade] = useState("")
  const [maxStudents, setMaxStudents] = useState("")
  const [certificate, setCertificate] = useState("")
  const [coordenadorId, setCoordenadorId] = useState("")
  const [isAtivo, setIsAtivo] = useState<boolean | null>(null)

  useEffect(() => {
    if (!courseId) return

    const load = async () => {
      try {
        setLoading(true)
        const data = await cursosService.getById(courseId)
        if (data) {
          setCourse(data)
          setSlug(data.slug ?? "")
          setTitle(data.title ?? "")
          setSubtitle(data.subtitle ?? "")
          setCategory(data.category ?? "")
          setCategoryLabel(data.categoryLabel ?? "")
          setModalidade(data.modalidade ?? "")
          setMaxStudents(data.maxStudents ?? "")
          setCertificate(data.certificate ?? "")
          setCoordenadorId(data.coordenadorId ?? "")
          setIsAtivo(parseBooleanFromUnknown(data.is_ativo))
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

  const sanitizedState = useMemo(() => {
    const normalizedSlug = normalizeValue(slug)
    return {
      slug: normalizedSlug,
      title: normalizeValue(title),
      subtitle: subtitle.trim(),
      category: category.trim(),
      categoryLabel: categoryLabel.trim(),
      modalidade: modalidade.trim(),
      maxStudents: maxStudents.trim(),
      certificate: certificate.trim(),
      coordenadorId: coordenadorId.trim(),
      isAtivo: isAtivo,
    }
  }, [slug, title, subtitle, category, categoryLabel, modalidade, maxStudents, certificate, coordenadorId, isAtivo])

  const isDirty = useMemo(() => {
    if (!course) return false
    return (
      sanitizedState.slug !== (course.slug ?? "") ||
      sanitizedState.title !== (course.title ?? "") ||
      sanitizedState.subtitle !== (course.subtitle ?? "") ||
      sanitizedState.category !== (course.category ?? "") ||
      sanitizedState.categoryLabel !== (course.categoryLabel ?? "") ||
      sanitizedState.modalidade !== (course.modalidade ?? "") ||
      sanitizedState.maxStudents !== (course.maxStudents ?? "") ||
      sanitizedState.certificate !== (course.certificate ?? "") ||
      sanitizedState.coordenadorId !== (course.coordenadorId ?? "") ||
      sanitizedState.isAtivo !== (course.is_ativo ?? null)
    )
  }, [course, sanitizedState])

  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  const handleSave = useCallback(async () => {
    if (!course) return

    try {
      setSaving(true)
      const payload: Curso = {
        ...course,
        slug: sanitizedState.slug,
        title: sanitizedState.title,
        subtitle: sanitizedState.subtitle,
        category: sanitizedState.category,
        categoryLabel: sanitizedState.categoryLabel,
        modalidade: sanitizedState.modalidade,
        maxStudents: sanitizedState.maxStudents,
        certificate: sanitizedState.certificate,
        is_ativo: sanitizedState.isAtivo ?? course.is_ativo ?? null,
        coordenadorId: sanitizedState.coordenadorId || null,
      }

      const updated = await cursosService.update(course.id, payload)
      setCourse(updated)
      toast.success("Dados básicos atualizados com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar dados básicos", error)
      const message = error instanceof Error ? error.message : "Não foi possível salvar."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }, [course, sanitizedState])

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const shouldLeave = window.confirm("Existem alterações não salvas. Deseja descartar e voltar?")
      if (!shouldLeave) return
    }
    router.push("/dashboard/novos-cursos")
  }, [isDirty, router])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault()
        event.stopPropagation()
        void handleSave()
        return
      }

      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        handleCancel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave, handleCancel])

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
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Dados básicos do curso</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Atualize identificadores, categorias e informações gerais utilizadas em toda a plataforma.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Nome oficial do curso"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(event) => setSubtitle(event.target.value)}
                  placeholder="Resumo curto visível nas listagens"
                />
              </div>

              <div className="md:col-span-2 grid gap-4 md:grid-cols-[1fr,1fr]">
                <div className="space-y-2">
                  <div className="grid gap-2 md:grid-cols-6">
                    <div className="space-y-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={category ? category : EMPTY_OPTION_VALUE}
                        onValueChange={(value) => {
                          if (value === EMPTY_OPTION_VALUE) {
                            setCategory("")
                            setCategoryLabel("")
                            return
                          }
                          setCategory(value)
                          setCategoryLabel(COURSE_CATEGORY_LABEL_MAP[value] ?? "")
                        }}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={EMPTY_OPTION_VALUE}>Sem categoria</SelectItem>
                          {COURSE_CATEGORY_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="isAtivo">Status do curso</Label>
                      <Select value={isAtivo ? BOOL_OPTION_TRUE : BOOL_OPTION_FALSE} onValueChange={(value) => setIsAtivo(value === BOOL_OPTION_TRUE)}>
                        <SelectTrigger id="isAtivo">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={BOOL_OPTION_TRUE}>Ativo</SelectItem>
                          <SelectItem value={BOOL_OPTION_FALSE}>Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="coordenador">Coordenador responsável</Label>
                    <SelectCoordenador
                      value={coordenadorId || null}
                      onChange={(value) => setCoordenadorId(value ?? "")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxStudents">Máximo de alunos</Label>
                  <Input
                    id="maxStudents"
                    value={maxStudents}
                    onChange={(event) => setMaxStudents(event.target.value)}
                    placeholder="Limite de vagas"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modalidade">Modalidade</Label>
                <Input
                  id="modalidade"
                  value={modalidade}
                  onChange={(event) => setModalidade(event.target.value)}
                  placeholder="ex: Presencial, Híbrido, EAD"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate">Certificação</Label>
                <Input
                  id="certificate"
                  value={certificate}
                  onChange={(event) => setCertificate(event.target.value)}
                  placeholder="ex: Certificado reconhecido pelo MEC"
                />
              </div>
            </div>

             <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  readOnly
                  disabled
                  placeholder="ex: mba-gestao-estrategica"
                />
                <p className="text-xs text-muted-foreground">O slug é utilizado em URLs e não pode ser alterado por aqui.</p>
              </div>

          </CardContent>
          <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving || !isDirty}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                "Salvar dados básicos"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
