"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ImageIcon, Loader2, SlidersHorizontal } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/ui/image-upload"
import { SelectCategoriaCurso } from "@/components/shared/select-categoria-curso"
import { SelectCoordenador } from "@/components/shared/select-coordenador"
import { slugify } from "@/lib/slugify"
import { cursosService, type Curso } from "@/services/cursos/cursos-service"

type CategoriaState = { categoria: string; rotulo: string } | null

export default function NovoCursoBasicoPage() {
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [manualSlug, setManualSlug] = useState(false)

  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [categoria, setCategoria] = useState<CategoriaState>(null)
  const [modalidade, setModalidade] = useState("")
  const [maxStudents, setMaxStudents] = useState("")
  const [certificate, setCertificate] = useState("")
  const [coordenadorId, setCoordenadorId] = useState<string | null>(null)
  const [isAtivo, setIsAtivo] = useState(true)

  const [imageFolder, setImageFolder] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [videoUrl, setVideoUrl] = useState("")

  const sanitizedState = useMemo(
    () => ({
      slug: slug.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: categoria?.categoria ?? "",
      categoryLabel: categoria?.rotulo ?? "",
      modalidade: modalidade.trim(),
      maxStudents: maxStudents.trim(),
      certificate: certificate.trim(),
      coordenadorId: coordenadorId ?? "",
      imageFolder: imageFolder.trim(),
      imageUrl: imageUrl.trim(),
      videoUrl: videoUrl.trim(),
      isAtivo,
    }),
    [
      slug,
      title,
      subtitle,
      categoria,
      modalidade,
      maxStudents,
      certificate,
      coordenadorId,
      imageFolder,
      imageUrl,
      videoUrl,
      isAtivo,
    ],
  )

  const canSave = sanitizedState.slug.length > 0 && sanitizedState.title.length > 0 && !saving

  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!manualSlug) {
      setSlug(slugify(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setManualSlug(true)
    setSlug(slugify(value))
  }

  const handleCancel = () => {
    if (saving) return
    router.push("/dashboard/cursos")
  }

  const handleSave = async () => {
    if (!sanitizedState.slug || !sanitizedState.title) {
      toast.error("Informe pelo menos o título e o slug do curso.")
      return
    }

    try {
      setSaving(true)
      const payload: Omit<Curso, "id" | "createdAt" | "updatedAt"> = {
        slug: sanitizedState.slug,
        title: sanitizedState.title,
        subtitle: sanitizedState.subtitle || undefined,
        shortDescription: "",
        category: sanitizedState.category || undefined,
        categoryLabel: sanitizedState.categoryLabel || undefined,
        modalidade: sanitizedState.modalidade || undefined,
        maxStudents: sanitizedState.maxStudents || undefined,
        certificate: sanitizedState.certificate || undefined,
        coordenadorId: sanitizedState.coordenadorId || undefined,
        image_folder: sanitizedState.imageFolder || undefined,
        imageUrl: sanitizedState.imageUrl || undefined,
        videoUrl: sanitizedState.videoUrl || undefined,
        is_ativo: sanitizedState.isAtivo,
      }

      const created = await cursosService.create(payload)
      toast.success("Curso criado com sucesso!")
      router.push(`/dashboard/cursos/${created.id}/editar-dados-basicos`)
    } catch (error) {
      console.error("Erro ao criar curso", error)
      const message = error instanceof Error ? error.message : "Não foi possível salvar o curso."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {saving ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-md border bg-card px-6 py-5 text-card-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm font-medium">Salvando novo curso...</p>
          </div>
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

      <Card>
        <CardHeader className="space-y-2 border-b bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Dados básicos iniciais</CardTitle>
              <p className="text-sm text-muted-foreground">
                Preencha apenas as informações essenciais para criar o curso.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Título do curso</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => handleTitleChange(event.target.value)}
                placeholder="Ex: Pós-graduação em Direito Digital"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(event) => handleSlugChange(event.target.value)}
                placeholder="pos-graduacao-direito-digital"
              />
              <p className="text-xs text-muted-foreground">
                Será usado na URL pública do curso. Apenas letras minúsculas, números e hífens.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subtitle">Subtítulo / chamada</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(event) => setSubtitle(event.target.value)}
              placeholder="Descrição breve para destacar o curso"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <SelectCategoriaCurso
                value={categoria?.categoria ?? ""}
                onChange={(value) => setCategoria(value)}
                triggerClassName="h-9"
                placeholder="Selecione a categoria"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modalidade">Modalidade</Label>
              <Input
                id="modalidade"
                value={modalidade}
                onChange={(event) => setModalidade(event.target.value)}
                placeholder="Ex: Presencial / Híbrido"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={isAtivo ? "true" : "false"} onValueChange={(value) => setIsAtivo(value === "true")}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="maxStudents">Máx. de alunos</Label>
              <Input
                id="maxStudents"
                value={maxStudents}
                onChange={(event) => setMaxStudents(event.target.value)}
                placeholder="Ex: 50 alunos"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="certificate">Certificação</Label>
              <Input
                id="certificate"
                value={certificate}
                onChange={(event) => setCertificate(event.target.value)}
                placeholder="Ex: Certificado MEC"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Coordenador responsável</Label>
              <SelectCoordenador value={coordenadorId} onChange={setCoordenadorId} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2 border-b bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Mídias do curso</CardTitle>
              <p className="text-sm text-muted-foreground">Defina a capa principal e imagens adicionais.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <ImageUpload
              label="Imagem de capa"
              description="Utilizada nos cards e listagens principais."
              value={imageFolder || undefined}
              onChange={(value) => setImageFolder(value ?? "")}
            />
            <ImageUpload
              label="Imagem adicional / thumbnail"
              description="Pode ser usada em páginas internas ou destaques."
              value={imageUrl || undefined}
              onChange={(value) => setImageUrl(value ?? "")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="videoUrl">Vídeo (opcional)</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="URL completa do vídeo de apresentação"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardFooter className="flex flex-col gap-3 border-t bg-muted/30 py-4 sm:flex-row sm:justify-end">
          <Button variant="outline" type="button" onClick={handleCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={!canSave}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar curso
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
