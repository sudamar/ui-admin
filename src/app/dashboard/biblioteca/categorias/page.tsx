"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import * as Icons from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, MoreHorizontal, Plus, Search, Tag, Trash2, type LucideIcon } from "lucide-react"

import { categoriasService, type Categoria } from "@/services/trabalhos/categorias-service"

const getIconComponent = (icon?: string): LucideIcon => {
  if (!icon) return Tag
  const IconComponent = Icons[icon as keyof typeof Icons] as LucideIcon | undefined
  return IconComponent ?? Tag
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await categoriasService.getAll()
        setCategorias(data)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const filteredCategorias = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    const filtered = term
      ? categorias.filter((categoria) =>
          [categoria.nome, categoria.icone ?? "", categoria.cor ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(term),
        )
      : categorias

    return [...filtered].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
    )
  }, [categorias, searchTerm])

  const handleDelete = async (id: string) => {
    const categoria = categorias.find((item) => item.id === id)
    if (!categoria) return

    const shouldDelete = confirm(`Deseja realmente remover a categoria "${categoria.nome}"?`)
    if (!shouldDelete) return

    try {
      await categoriasService.delete(id)
      setCategorias((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Erro ao remover categoria", error)
      alert("Não foi possível remover a categoria. Tente novamente.")
    }
  }

  return (
    <div className="flex-1 space-y-4 pb-10 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Categorias</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Organize as tags utilizadas nos trabalhos publicados.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/biblioteca/categorias/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova categoria
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-1">
          <CardTitle>Gerenciamento de categorias</CardTitle>
          <CardDescription>
            {categorias.length} categoria(s) cadastrada(s) • {filteredCategorias.length} exibida(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="w-full md:w-[320px]">
              <label htmlFor="category-search" className="mb-1 block text-sm font-medium text-muted-foreground">
                Buscar categoria
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="category-search"
                  placeholder="Busque por nome, ícone ou classes"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-dashed border-border/70 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">Carregando categorias...</p>
            </div>
          ) : filteredCategorias.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-foreground">Nenhuma categoria encontrada</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste sua busca ou cadastre uma nova categoria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[240px]">Categoria</TableHead>
                    <TableHead className="min-w-[220px]">Cor (classes)</TableHead>
                    <TableHead className="min-w-[160px]">Exemplo</TableHead>
                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategorias.map((categoria) => {
                    const Icon = getIconComponent(categoria.icone ?? undefined)
                    return (
                      <TableRow key={categoria.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span
                              className={`inline-block h-6 w-6 rounded border ${categoria.cor ?? "border-border bg-muted"}`}
                              aria-hidden="true"
                            />
                            <span className="inline-flex size-9 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </span>
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{categoria.nome}</span>
                              {categoria.icone ? (
                                <span className="text-xs text-muted-foreground">Ícone: {categoria.icone}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">Ícone padrão</span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="block rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                            {categoria.cor ?? "sem classes definidas"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`${categoria.cor ?? "border-border bg-muted text-muted-foreground"} gap-1`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            {categoria.nome}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/biblioteca/categorias/${categoria.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(categoria.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
