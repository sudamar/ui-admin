"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Folder, FileText, BookOpen, Image as ImageIcon, DollarSign, Star, ArrowUpDown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cursosService, type CoursePreview } from "@/services/cursos/cursos-service"

const actions = [
  { label: "Dados Básicos", slug: "editar-dados-basicos", icon: FileText },
  { label: "Conteúdo", slug: "editar-conteudo", icon: BookOpen },
  { label: "Mídias", slug: "editar-midias", icon: ImageIcon },
  { label: "Valores", slug: "editar-valores", icon: DollarSign },
  { label: "Destaques", slug: "editar-destaques", icon: Star },
]

// Função para remover tags HTML de uma string
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "")
}

type SortField = "title" | "category" | "status"
type SortDirection = "asc" | "desc"

export function NovosCursosTable() {
  const [courses, setCourses] = useState<CoursePreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("title")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await cursosService.getAll()
        setCourses(data)
      } catch (err) {
        console.error("Erro ao carregar cursos", err)
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os cursos."
        )
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const categories = useMemo(() => {
    const uniqueCategories = new Set(courses.map((c) => c.category))
    return Array.from(uniqueCategories).sort()
  }, [courses])

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchTerm === "" ||
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.shortDescription ?? "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        categoryFilter === "all" || course.category === categoryFilter

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && course.is_ativo === true) ||
        (statusFilter === "inactive" && course.is_ativo === false)

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [courses, searchTerm, categoryFilter, statusFilter])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedCourses = useMemo(() => {
    return [...filteredCourses].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" })
          break
        case "category":
          comparison = (a.category ?? "").localeCompare(b.category ?? "", "pt-BR", { sensitivity: "base" })
          break
        case "status":
          comparison = (a.is_ativo === b.is_ativo) ? 0 : (a.is_ativo ? -1 : 1)
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredCourses, sortField, sortDirection])

  const renderImage = (course: CoursePreview) => {
    if (course.image_folder) {
      return (
        <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
          <Image
            src={course.image_folder}
            alt={course.title}
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
      )
    }

    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted text-muted-foreground">
        <Folder className="h-5 w-5" />
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Novos Cursos</CardTitle>
          <CardDescription>Carregando cursos cadastrados...</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Buscando informações...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Novos Cursos</CardTitle>
          <CardDescription>Não foi possível carregar os cursos.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={() => window.location.reload()} size="sm">
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (sortedCourses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Novos Cursos</CardTitle>
          <CardDescription>Nenhum curso encontrado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Cadastre um curso para visualizá-lo aqui.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novos Cursos</CardTitle>
        <CardDescription>
          Total de {courses.length} curso(s) cadastrado(s) • {sortedCourses.length} exibido(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
          <div className="w-full sm:w-[280px]">
            <label htmlFor="search" className="text-sm font-medium">
              Buscar por nome
            </label>
            <Input
              id="search"
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="w-auto">
            <label htmlFor="category" className="text-sm font-medium">
              Categoria
            </label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category" className="mt-2 w-auto min-w-[120px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-auto">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status" className="mt-2 w-auto min-w-[120px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="hidden overflow-x-auto xl:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]" />
                <TableHead className="w-[55%]">
                  <Button
                    variant="ghost"
                    className="px-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("title")}
                  >
                    Nome
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="px-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("category")}
                  >
                    Categoria
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]">
                  <Button
                    variant="ghost"
                    className="px-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort("status")}
                  >
                    Ativo
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[280px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>{renderImage(course)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold leading-tight">{course.title}</p>
                      {course.shortDescription ? (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {stripHtmlTags(course.shortDescription)}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">
                      {course.categoryLabel ?? course.category}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={course.is_ativo ? "default" : "secondary"}>
                      {course.is_ativo ? "Sim" : "Não"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {actions.slice(0, 3).map((action, index) => {
                            const Icon = action.icon
                            const colors = ["text-slate-600", "text-blue-600", "text-purple-600"]
                            return (
                              <Tooltip key={action.slug}>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    asChild
                                  >
                                    <Link href={`/dashboard/novos-cursos/${course.id}/${action.slug}`}>
                                      <Icon className={`h-4 w-4 ${colors[index]}`} />
                                      <span className="sr-only">{action.label}</span>
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{action.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          {actions.slice(3).map((action, index) => {
                            const Icon = action.icon
                            const colors = ["text-green-600", "text-amber-600"]
                            return (
                              <Tooltip key={action.slug}>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-8 w-8"
                                    asChild
                                  >
                                    <Link href={`/dashboard/novos-cursos/${course.id}/${action.slug}`}>
                                      <Icon className={`h-4 w-4 ${colors[index]}`} />
                                      <span className="sr-only">{action.label}</span>
                                    </Link>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{action.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="space-y-3 xl:hidden">
          {sortedCourses.map((course) => (
            <Card key={course.id} className="border border-border/60">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  {renderImage(course)}
                  <div className="flex-1">
                    <p className="font-semibold leading-tight text-foreground">
                      {course.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        {course.categoryLabel ?? course.category}
                      </p>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant={course.is_ativo ? "default" : "secondary"} className="text-xs">
                        {course.is_ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <TooltipProvider>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-center gap-2">
                      {actions.slice(0, 3).map((action, index) => {
                        const Icon = action.icon
                        const colors = ["text-slate-600", "text-blue-600", "text-purple-600"]
                        return (
                          <Tooltip key={action.slug}>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-10 w-10"
                                asChild
                              >
                                <Link href={`/dashboard/novos-cursos/${course.id}/${action.slug}`}>
                                  <Icon className={`h-5 w-5 ${colors[index]}`} />
                                  <span className="sr-only">{action.label}</span>
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{action.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {actions.slice(3).map((action, index) => {
                        const Icon = action.icon
                        const colors = ["text-green-600", "text-amber-600"]
                        return (
                          <Tooltip key={action.slug}>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-10 w-10"
                                asChild
                              >
                                <Link href={`/dashboard/novos-cursos/${course.id}/${action.slug}`}>
                                  <Icon className={`h-5 w-5 ${colors[index]}`} />
                                  <span className="sr-only">{action.label}</span>
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{action.label}</p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  </div>
                </TooltipProvider>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
