"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ImageUpload } from "@/components/ui/image-upload"
import { RichTextEditorHybrid } from "@/components/shared/rich-text-editor-hybrid"
import { useAuth } from "@/contexts/auth-context"
import { postsService, type Post, type PostInput } from "@/services/posts/posts-service"
import { slugify } from "@/lib/slugify"

type PostFormPageProps = {
  mode: "create" | "edit"
  postId?: string
}

export function PostFormPageClient({ mode, postId }: PostFormPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState<PostInput>({
    slug: "",
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    excerpt: "",
    content: "",
    image: "",
    published: true,
    author: user?.displayName ?? user?.name ?? "",
    authorInfo: user
      ? {
          id: user.id,
          email: user.email,
          displayName: user.displayName ?? user.name,
        }
      : undefined,
  })
  const [slugEdited, setSlugEdited] = useState(false)

  useEffect(() => {
    if (mode === "edit" && postId) {
      const load = async () => {
        try {
          setLoading(true)
          const post = await postsService.getById(postId)
          if (!post) {
            toast.error("Post não encontrado.")
            router.push("/dashboard/posts")
            return
          }
          setValues({
            slug: post.slug,
            title: post.title,
            date: post.date,
            excerpt: post.excerpt,
            content: post.content,
            image: post.image,
            published: post.published,
            author: post.author,
            authorInfo: post.authorInfo,
          })
          setSlugEdited(true)
        } catch (error) {
          console.error(error)
          toast.error("Não foi possível carregar o post.")
          router.push("/dashboard/posts")
        } finally {
          setLoading(false)
        }
      }
      void load()
    }
  }, [mode, postId, router])

  const handleChange = (field: keyof PostInput, value: string | boolean | Record<string, unknown> | undefined) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleTitleChange = (value: string) => {
    handleChange("title", value)
    if (!slugEdited) {
      handleChange("slug", slugify(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugEdited(true)
    handleChange("slug", slugify(value))
  }

  const handleImageChange = (url?: string | null) => {
    handleChange("image", url ?? "")
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) {
      toast.error("Usuário não autenticado.")
      return
    }
    setSaving(true)

    const payload: PostInput = {
      slug: values.slug,
      title: values.title,
      date: values.date,
      excerpt: values.excerpt,
      content: values.content,
      image: values.image,
      published: values.published ?? true,
      author: user.displayName ?? user.name,
      authorInfo: {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? user.name,
      },
    }

    try {
      if (mode === "edit" && postId) {
        await postsService.update(postId, payload)
        toast.success("Post atualizado com sucesso.")
      } else {
        await postsService.create(payload)
        toast.success("Post criado com sucesso.")
      }
      router.push("/dashboard/posts")
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível salvar o post.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{mode === "edit" ? "Editar post" : "Novo post"}</h1>
        <p className="text-sm text-muted-foreground">
          {mode === "edit" ? "Atualize as informações do post selecionado." : "Crie um post para o blog da FAFIH."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações principais</CardTitle>
          <CardDescription>Defina título, slug e resumo do conteúdo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={values.title} onChange={(event) => handleTitleChange(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={values.slug} onChange={(event) => handleSlugChange(event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={values.date} onChange={(event) => handleChange("date", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">Imagem destaque</Label>
              <ImageUpload label="Imagem destaque" description="Essa imagem aparecerá no blog." value={values.image || undefined} onChange={handleImageChange} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Resumo</Label>
            <Textarea id="excerpt" value={values.excerpt ?? ""} onChange={(event) => handleChange("excerpt", event.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <RichTextEditorHybrid
              value={values.content ?? ""}
              onChange={(html) => handleChange("content", html)}
              minHeight="320px"
              placeholder="Escreva o conteúdo completo do post..."
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Publicado</Label>
              <p className="text-xs text-muted-foreground">Controle se o post aparece no blog.</p>
            </div>
            <Switch checked={values.published ?? true} onCheckedChange={(checked) => handleChange("published", checked)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/posts")}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
            </>
          ) : mode === "edit" ? (
            "Salvar alterações"
          ) : (
            "Criar post"
          )}
        </Button>
      </div>
    </form>
  )
}
