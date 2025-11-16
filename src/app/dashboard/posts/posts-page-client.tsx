"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowUpDown, Eye, FilePlus2, Loader2, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSettingsContext } from "@/contexts/settings-context"
import { postsService, type Post } from "@/services/posts/posts-service"

type SortField = "title" | "date" | "published"
type SortDirection = "asc" | "desc"

export function PostsPageClient() {
  const { settings } = useSettingsContext()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await postsService.getAll()
        setPosts(data)
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível carregar os posts.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const siteBaseUrl = useMemo(() => (settings?.url_site ?? "https://site.fafih.com.br").replace(/\/$/, ""), [settings])

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const term = searchTerm.toLowerCase()
        const match =
          post.title.toLowerCase().includes(term) ||
          post.excerpt.toLowerCase().includes(term) ||
          post.content.toLowerCase().includes(term)
        const statusMatch =
          statusFilter === "all" ||
          (statusFilter === "published" && post.published) ||
          (statusFilter === "draft" && !post.published)
        return match && statusMatch
      })
      .sort((a, b) => {
        let comparison = 0
        if (sortField === "title") {
          comparison = a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" })
        } else if (sortField === "published") {
          comparison = Number(a.published) - Number(b.published)
        } else {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
        }
        return sortDirection === "asc" ? comparison : -comparison
      })
  }, [posts, searchTerm, statusFilter, sortField, sortDirection])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection(field === "title" ? "asc" : "desc")
    }
  }

  const handleDelete = async (post: Post) => {
    const confirmed = window.confirm(`Deseja excluir o post "${post.title}"?`)
    if (!confirmed) return
    try {
      await postsService.delete(post.id)
      setPosts((prev) => prev.filter((item) => item.id !== post.id))
      toast.success("Post excluído com sucesso.")
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível excluir o post.")
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posts do blog</h1>
          <p className="text-sm text-muted-foreground">Gerencie os conteúdos publicados para o blog da FAFIH.</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/posts/new">
            <FilePlus2 className="mr-2 h-4 w-4" />
            Novo post
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Posts cadastrados</CardTitle>
          <CardDescription>Filtre por texto, status ou ordene clicando nos cabeçalhos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Buscar por título, resumo ou conteúdo..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="md:w-1/2"
            />
            <Select value={statusFilter} onValueChange={(value: "all" | "published" | "draft") => setStatusFilter(value)}>
              <SelectTrigger className="md:w-60">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="draft">Rascunhos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">
                    <SortButton label="Título" active={sortField === "title"} direction={sortDirection} onClick={() => toggleSort("title")} />
                  </TableHead>
                  <TableHead className="w-[15%]">
                    <SortButton label="Data" active={sortField === "date"} direction={sortDirection} onClick={() => toggleSort("date")} />
                  </TableHead>
                  <TableHead className="w-[15%]">Autor</TableHead>
                  <TableHead className="w-[15%]">
                    <SortButton
                      label="Status"
                      active={sortField === "published"}
                      direction={sortDirection}
                      onClick={() => toggleSort("published")}
                    />
                  </TableHead>
                  <TableHead>Resumo</TableHead>
                  <TableHead className="w-[140px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPosts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-semibold">{post.title}</TableCell>
                    <TableCell>{format(new Date(post.date), "P", { locale: ptBR })}</TableCell>
                    <TableCell>{post.author || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={post.published ? "default" : "secondary"} className={post.published ? "bg-emerald-600" : "bg-amber-500"}>
                        {post.published ? "Publicado" : "Rascunho"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt || "—"}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => window.open(`${siteBaseUrl}/blog/${post.slug}`, "_blank")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9">
                          <Link href={`/dashboard/posts/${post.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => handleDelete(post)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                      Nenhum post encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
function SortButton({
  label,
  active,
  direction,
  onClick,
}: {
  label: string
  active?: boolean
  direction: SortDirection
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`-ml-3 px-3 font-semibold ${active ? "text-primary" : ""}`}
      onClick={onClick}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}
