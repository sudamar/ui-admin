"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Camera, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/ui/image-upload"
import { HeaderEdicaoCursos } from "@/features/cursos/components/header-edicao-cursos"
import { cursosService, type Curso } from "@/services/cursos/cursos-service"
import { toast } from "sonner"

const normalizeValue = (value: string) => value.trim()

export default function EditarMidiasPage() {
  const params = useParams<{ id: string }>()
  const courseSlugOrId = params?.id
  const router = useRouter()

  const [course, setCourse] = useState<Curso | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [imageFolder, setImageFolder] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")

  useEffect(() => {
    if (!courseSlugOrId) return

    const load = async () => {
      try {
        setLoading(true)
        let data = await cursosService.getById(courseSlugOrId)
        if (!data) {
          data = await cursosService.getBySlug(courseSlugOrId)
        }
        if (data) {
          setCourse(data)
          setImageFolder(data.image_folder ?? "")
          setImageUrl(data.imageUrl ?? "")
          setVideoUrl(data.videoUrl ?? "")
        }
      } catch (error) {
        console.error("Erro ao carregar curso", error)
        toast.error("Não foi possível carregar as mídias do curso.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [courseSlugOrId])

  const sanitizedState = useMemo(
    () => ({
      imageFolder: normalizeValue(imageFolder),
      imageUrl: normalizeValue(imageUrl),
      videoUrl: normalizeValue(videoUrl),
    }),
    [imageFolder, imageUrl, videoUrl],
  )

  const isDirty = useMemo(() => {
    if (!course) return false
    return (
      sanitizedState.imageFolder !== (course.image_folder ?? "") ||
      sanitizedState.imageUrl !== (course.imageUrl ?? "") ||
      sanitizedState.videoUrl !== (course.videoUrl ?? "")
    )
  }, [course, sanitizedState])

  const handleSave = useCallback(async () => {
    if (!course) return

    try {
      setSaving(true)
      const payload: Curso = {
        ...course,
        image_folder: sanitizedState.imageFolder ? sanitizedState.imageFolder : undefined,
        imageUrl: sanitizedState.imageUrl ? sanitizedState.imageUrl : undefined,
        videoUrl: sanitizedState.videoUrl ? sanitizedState.videoUrl : undefined,
      }

      const updated = await cursosService.update(course.id, payload)
      setCourse(updated)
      setImageFolder(updated.image_folder ?? "")
      setImageUrl(updated.imageUrl ?? "")
      setVideoUrl(updated.videoUrl ?? "")
      toast.success("Mídias atualizadas com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar mídias", error)
      const message = error instanceof Error ? error.message : "Não foi possível atualizar as mídias."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }, [course, sanitizedState])

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm("Existem alterações não salvas. Deseja descartar e voltar?")) {
      return
    }
    router.push("/dashboard/cursos")
  }, [isDirty, router])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() == "s") {
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
    <div className="space-y-6">
      {saving ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Salvando mídias...</p>
        </div>
      ) : null}

      <Button
        asChild
        variant="ghost"
        className="inline-flex w-full items-center justify-center gap-2 border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/80 sm:w-auto"
      >
        <Link href="/dashboard/cursos">
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista de cursos
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
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Mídias do curso</CardTitle>
              <p className="text-sm text-muted-foreground">
                Atualize capa, thumbnail e link de vídeo relacionados ao curso.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ImageUpload
              label="Imagem de Capa do Curso"
              description="Esta imagem é exibida nos cards e nas páginas do curso."
              value={imageFolder || undefined}
              onChange={(value) => setImageFolder(value ?? "")}
            />
            <ImageUpload
              label="Capa da Landing Page"
              description="Use este campo para thumbnails secundárias ou imagens de apoio."
              value={imageUrl || undefined}
              onChange={(value) => setImageUrl(value ?? "")}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="videoUrl">URL do vídeo</Label>
            <Input
              id="videoUrl"
              type="url"
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="text-xs text-muted-foreground">Informe um link público (YouTube, Vimeo, etc.).</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              "Salvar mídias"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
