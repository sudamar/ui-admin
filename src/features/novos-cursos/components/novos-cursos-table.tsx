"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Folder, MoreHorizontal, Pencil } from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cursosService, type CoursePreview } from "@/services/cursos/cursos-service"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const actions = [
  { label: "Editar Dados Básicos", slug: "editar-dados-basicos" },
  { label: "Editar Conteúdo", slug: "editar-conteudo" },
  { label: "Editar Mídias", slug: "editar-midias" },
  { label: "Editar Valores", slug: "editar-valores" },
  { label: "Editar Destaques", slug: "editar-destaques" },
]

export function NovosCursosTable() {
  const [courses, setCourses] = useState<CoursePreview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const sortedCourses = useMemo(
    () =>
      [...courses].sort((a, b) =>
        a.title.localeCompare(b.title, "pt-BR", { sensitivity: "base" })
      ),
    [courses]
  )

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
          Total de {sortedCourses.length} curso(s) cadastrado(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="hidden overflow-x-auto xl:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]" />
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="w-[180px]">Valor</TableHead>
                <TableHead className="w-[200px] text-center">Ações</TableHead>
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
                          {course.shortDescription}
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
                    <div className="space-y-1 text-right">
                      <p className="text-base font-semibold text-foreground">
                        {typeof course.price === "number"
                          ? currencyFormatter.format(course.price)
                          : "Sob consulta"}
                      </p>
                      {typeof course.originalPrice === "number" &&
                      course.originalPrice > (course.price ?? 0) ? (
                        <p className="text-xs text-muted-foreground line-through">
                          {currencyFormatter.format(course.originalPrice)}
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="mx-auto flex">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {actions.map((action) => (
                          <DropdownMenuItem asChild key={action.slug}>
                            <Link
                              href={`/dashboard/novos-cursos/${course.id}/${action.slug}`}
                              className="flex items-center gap-2"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {action.label}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    <p className="text-sm text-muted-foreground">
                      {course.categoryLabel ?? course.category}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-sm">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="text-base font-semibold text-foreground">
                    {typeof course.price === "number"
                      ? currencyFormatter.format(course.price)
                      : "Sob consulta"}
                  </span>
                  {typeof course.originalPrice === "number" &&
                  course.originalPrice > (course.price ?? 0) ? (
                    <span className="text-xs text-muted-foreground line-through">
                      {currencyFormatter.format(course.originalPrice)}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Button
                      key={action.slug}
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1 min-w-[140px]"
                    >
                      <Link href={`/dashboard/novos-cursos/${course.id}/${action.slug}`}>
                        {action.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
