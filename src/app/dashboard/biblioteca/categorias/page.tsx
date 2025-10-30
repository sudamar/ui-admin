"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
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
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import { categoriasService, type Categoria } from "@/services/trabalhos/categorias-service"
import { cn } from "@/lib/utils"

const getIconComponent = (icon?: string): LucideIcon => {
  if (!icon) return Tag
  const IconComponent = Icons[icon as keyof typeof Icons] as LucideIcon | undefined
  return IconComponent ?? Tag
}

const normalizeHex = (value: string) => {
  const hex = value.replace("#", "").trim()
  if (hex.length === 3) {
    return hex
      .split("")
      .map((char) => char + char)
      .join("")
  }
  return hex.padEnd(6, "0")
}

const getContrastColor = (hex: string) => {
  const normalized = normalizeHex(hex)
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#111827" : "#F8FAFC"
}

type BadgeAppearance = {
  badgeClass: string
  badgeStyle?: CSSProperties
  iconClass?: string
  iconStyle?: CSSProperties
  squareClass?: string
  squareStyle?: CSSProperties
}

const getAppearance = (cor?: string | null): BadgeAppearance => {
  const DEFAULT_BADGE = "border-border bg-muted text-muted-foreground"
  const DEFAULT_ICON = "text-muted-foreground"
  const DEFAULT_SQUARE = "border-border bg-muted"

  if (!cor) {
    return {
      badgeClass: DEFAULT_BADGE,
      iconClass: DEFAULT_ICON,
      squareClass: DEFAULT_SQUARE,
    }
  }

  const trimmed = cor.trim()
  if (trimmed.startsWith("#")) {
    const textColor = getContrastColor(trimmed)
    return {
      badgeClass: "border border-transparent",
      badgeStyle: { backgroundColor: trimmed, color: textColor },
      iconStyle: { color: textColor },
      squareStyle: { backgroundColor: trimmed, borderColor: trimmed },
    }
  }

  const textClass = trimmed
    .split(/\s+/)
    .find((cls) => cls.startsWith("text-"))

  return {
    badgeClass: trimmed,
    iconClass: textClass,
    squareClass: trimmed,
  }
}

type SortField = "nome" | "slug" | "cor"
type SortDirection = "asc" | "desc"

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>("nome")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredCategorias = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    const filtered = term
      ? categorias.filter((categoria) =>
          [categoria.nome, categoria.slug, categoria.icone ?? "", categoria.cor ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(term),
        )
      : categorias

    return [...filtered].sort((a, b) => {
      let comparison = 0

      if (sortField === "nome") {
        comparison = a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
      } else if (sortField === "slug") {
        comparison = a.slug.localeCompare(b.slug, "pt-BR", { sensitivity: "base" })
      } else if (sortField === "cor") {
        const corA = a.cor ?? ""
        const corB = b.cor ?? ""
        comparison = corA.localeCompare(corB, "pt-BR", { sensitivity: "base" })
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [categorias, searchTerm, sortField, sortDirection])

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
                  placeholder="Busque por nome, slug, ícone ou classes"
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
                    <TableHead className="min-w-[240px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "-ml-3 h-8 data-[state=open]:bg-accent",
                          sortField === "nome" && "text-foreground font-semibold",
                        )}
                        onClick={() => handleSort("nome")}
                      >
                        Categoria
                        {sortField === "nome" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[180px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "-ml-3 h-8 data-[state=open]:bg-accent",
                          sortField === "slug" && "text-foreground font-semibold",
                        )}
                        onClick={() => handleSort("slug")}
                      >
                        Slug
                        {sortField === "slug" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[220px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "-ml-3 h-8 data-[state=open]:bg-accent",
                          sortField === "cor" && "text-foreground font-semibold",
                        )}
                        onClick={() => handleSort("cor")}
                      >
                        Cor (classes)
                        {sortField === "cor" ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          )
                        ) : (
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="min-w-[160px]">Exemplo</TableHead>
                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategorias.map((categoria) => {
                    const Icon = getIconComponent(categoria.icone ?? undefined)
                    const appearance = getAppearance(categoria.cor)
                    return (
                      <TableRow key={categoria.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* <span
                              className={cn("inline-block h-6 w-6 rounded border", appearance.squareClass)}
                              aria-hidden="true"
                              style={appearance.squareStyle}
                            /> */}
                            <span className="inline-flex size-9 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                              <Icon
                                className={cn("h-4 w-4", appearance.iconClass)}
                                style={appearance.iconStyle}
                              />
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
                          <code className="block rounded bg-muted px-2 py-1 text-xs font-mono text-foreground">
                            {categoria.slug}
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="block rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                            {categoria.cor ?? "sem classes definidas"}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("gap-1", appearance.badgeClass)}
                            style={appearance.badgeStyle}
                          >
                            <Icon
                              className={cn("h-3.5 w-3.5", appearance.iconClass)}
                              style={appearance.iconStyle}
                            />
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
