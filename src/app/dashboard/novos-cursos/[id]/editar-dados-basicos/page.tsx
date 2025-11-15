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

const parseBooleanFromUnknown = (value: unknown): boolean => {
  if (typeof value === "boolean") return value
  if (typeof value === "string") {
    const n = value.trim().toLowerCase()
    if (["true", "t", "1"].includes(n)) return true
    if (["false", "f", "0"].includes(n)) return false
  }
  if (typeof value === "number") return value === 1
  return true
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
  const [modalidade, setModalidade] = useState("")
  const [maxStudents, setMaxStudents] = useState("")
  const [certificate, setCertificate] = useState("")
  const [coordenadorId, setCoordenadorId] = useState("")
  const [isAtivo, setIsAtivo] = useState<boolean>(true)

  useEffect(() => {
    if (!courseId) return

    const load = async () => {
      try {
        setLoading(true)
        const data = await cursosService.getById(courseId)
        if (data) {
          const resolvedStatus = parseBooleanFromUnknown((data as any).is_ativo ?? (data as any).isAtivo ?? true)
          setCourse({ ...data, is_ativo: resolvedStatus })
          setSlug(data.slug ?? "")
          setTitle(data.title ?? "")
          setSubtitle(data.subtitle ?? "")
          setCategory(data.category ?? "")
          setModalidade(data.modalidade ?? "")
          setMaxStudents(data.maxStudents ?? "")
          setCertificate(data.certificate ?? "")
          setCoordenadorId(data.coordenadorId ?? "")
          setIsAtivo(resolvedStatus)
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

  const sanitizedState = useMemo(() => ({
    slug: normalizeValue(slug),
    title: normalizeValue(title),
    subtitle: subtitle.trim(),
    category: category.trim(),
    modalidade: modalidade.trim(),
    maxStudents: maxStudents.trim(),
    certificate: certificate.trim(),
    coordenadorId: coordenadorId.trim(),
    isAtivo,
  }), [slug, title, subtitle, category, modalidade, maxStudents, certificate, coordenadorId, isAtivo])

  const isDirty = useMemo(() => {
    if (!course) return false
    return (
      sanitizedState.slug !== (course.slug ?? "") ||
      sanitizedState.title !== (course.title ?? "") ||
      sanitizedState.subtitle !== (course.subtitle ?? "") ||
      sanitizedState.category !== (course.category ?? "") ||
      sanitizedState.modalidade !== (course.modalidade ?? "") ||
      sanitizedState.maxStudents !== (course.maxStudents ?? "") ||
      sanitizedState.certificate !== (course.certificate ?? "") ||
      sanitizedState.coordenadorId !== (course.coordenadorId ?? "") ||
      sanitizedState.isAtivo !== parseBooleanFromUnknown(course.is_ativo ?? true)
    )
  }, [course, sanitizedState])

  const handleSave = useCallback(async () => {
    if (!course) return
    try {
      setSaving(true)
      const payload: Curso = {
        ...course,
        ...sanitizedState,
        coordenadorId: sanitizedState.coordenadorId || null,
      }
      const updated = await cursosService.update(course.id, payload)
      const updatedStatus = parseBooleanFromUnknown((updated as any).is_ativo ?? true)
      setCourse({ ...updated, is_ativo: updatedStatus })
      setIsAtivo(updatedStatus)
      toast.success("Dados básicos atualizados com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar dados", error)
      toast.error("Não foi possível salvar.")
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
      {saving && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Salvando alterações...</p>
        </div>
      )}

      <div className="mx-auto max-w-5xl space-y-6">
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
          category={course.category ?? "Não informado"}
          imageUrl={course.image_folder ?? course.imageUrl ?? null}
        />

        <Card>
          <CardHeader className="space-y-2 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Dados básicos do curso</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Atualize as informações gerais do curso.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Linha 1 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-6 space-y-1.5">
                <Label htmlFor="title">Título</Label>
                <Input id="title" className="h-9" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="md:col-span-6 space-y-1.5">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input id="subtitle" className="h-9" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
            </div>

            {/* Linha 2 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-6 space-y-1.5">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={category || EMPTY_OPTION_VALUE}
                  onValueChange={(value) => {
                    if (value === EMPTY_OPTION_VALUE) return setCategory("")
                    setCategory(value)
                  }}
                >
                  <SelectTrigger id="category" className="h-9">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_OPTION_VALUE}>Sem categoria</SelectItem>
                    {COURSE_CATEGORY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-6 space-y-1.5">
                <Label htmlFor="maxStudents">Máximo de alunos</Label>
                <Input id="maxStudents" className="h-9" value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)} placeholder="Ex: 25" />
              </div>
            </div>

            {/* Linha 3 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-6 space-y-1.5">
                <Label htmlFor="modalidade">Modalidade</Label>
                <Input id="modalidade" className="h-9" value={modalidade} onChange={(e) => setModalidade(e.target.value)} placeholder="Presencial / EAD" />
              </div>
              <div className="md:col-span-6 space-y-1.5">
                <Label htmlFor="certificate">Certificação</Label>
                <Input id="certificate" className="h-9" value={certificate} onChange={(e) => setCertificate(e.target.value)} placeholder="Reconhecida MEC" />
              </div>
            </div>

            {/* Linha 4 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-6 space-y-1.5">
                <Label htmlFor="coordenador">Coordenador</Label>
                <SelectCoordenador value={coordenadorId || null} onChange={(v) => setCoordenadorId(v ?? "")} />
              </div>
              <div className="md:col-span-3 space-y-1.5">
                <Label htmlFor="isAtivo">Status</Label>
                <Select value={isAtivo ? BOOL_OPTION_TRUE : BOOL_OPTION_FALSE} onValueChange={(v) => setIsAtivo(v === BOOL_OPTION_TRUE)}>
                  <SelectTrigger id="isAtivo" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={BOOL_OPTION_TRUE}>Ativo</SelectItem>
                    <SelectItem value={BOOL_OPTION_FALSE}>Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 5 */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-12 space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" className="h-9 opacity-80" value={slug} readOnly disabled />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t bg-background/60 p-4">
            <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !isDirty}>
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