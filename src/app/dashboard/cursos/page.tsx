'use client'

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Plus, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { coursesService, type CoursePreview } from "@/services/cursos/cursos-service"
import { cn } from "@/lib/utils"

const availabilityLabels: Record<CoursePreview["availability"], string> = {
  promotion: "Promoção",
  open: "Vagas em aberto",
  limited: "Faltam 5 vagas",
  "sold-out": "Esgotado",
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CoursePreview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | CoursePreview["availability"]>("all")

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true)
      try {
        const data = await coursesService.getAll()
        setCourses(data)
      } catch (error) {
        console.error("Erro ao carregar cursos:", error)
      } finally {
        setLoading(false)
      }
    }

    void loadCourses()
  }, [])

  const filteredCourses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return courses.filter((course) => {
      const matchesSearch =
        term.length === 0 ||
        course.title.toLowerCase().includes(term) ||
        course.description.toLowerCase().includes(term) ||
        course.category.toLowerCase().includes(term)

      const matchesStatus = statusFilter === "all" || course.availability === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [courses, searchTerm, statusFilter])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">Carregando cursos disponíveis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Cursos disponíveis</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Administre seu catálogo de cursos, promoções e vagas em tempo real.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard/cursos/new">
            <Plus className="size-4" />
            Novo curso
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo de cursos</CardTitle>
          <CardDescription>
            Total de {courses.length} cursos • {filteredCourses.length} exibido(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, categoria ou descrição..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por disponibilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="promotion">{availabilityLabels.promotion}</SelectItem>
                <SelectItem value="open">{availabilityLabels.open}</SelectItem>
                <SelectItem value="limited">{availabilityLabels.limited}</SelectItem>
                <SelectItem value="sold-out">{availabilityLabels["sold-out"]}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-foreground">Nenhum curso encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste os filtros ou cadastre um novo curso para visualizá-lo aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                  <TableRow>
                    <TableHead className="w-[72px]">Capa</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead className="hidden lg:table-cell">Categoria</TableHead>
                    <TableHead className="hidden lg:table-cell">Investimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="relative h-16 w-24 overflow-hidden rounded-md border bg-muted">
                          {course.image ? (
                            <Image
                              src={course.image}
                              alt={course.title}
                              fill
                              sizes="96px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              sem imagem
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-semibold leading-none">{course.title}</div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground capitalize">
                        {course.categoryLabel ?? course.category.replace(/-/g, " ")}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-col text-sm">
                          {typeof course.price === "number" ? (
                            <span className="font-semibold text-foreground">
                              {course.price.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Sob consulta</span>
                          )}
                          {course.originalPrice && course.originalPrice > (course.price ?? 0) ? (
                            <span className="text-xs text-muted-foreground line-through">
                              {course.originalPrice.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {course.tags.length > 0
                            ? course.tags.map((tag) => (
                                <Badge
                                  key={`${course.id}-${tag.label}`}
                                  variant={tag.variant ?? "secondary"}
                                  className={cn(tag.className)}
                                >
                                  {tag.label}
                                </Badge>
                              ))
                            : (
                                <Badge variant="outline">
                                  {availabilityLabels[course.availability]}
                                </Badge>
                              )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Ações
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Gerenciar curso</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/cursos/${course.id}`}>
                                Ver detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/cursos/${course.id}/edit`}>
                                Editar informações
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              Remover curso
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
