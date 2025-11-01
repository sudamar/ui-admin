"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Edit, Eye, MoreHorizontal, Plus, Search, Tag, Trash2, type LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"

import MultipleSelector, { type Option } from "@/components/ui/multiselect"
import { categoriasService, type Categoria } from "@/services/trabalhos/categorias-service"
import { trabalhosService, type Trabalho } from "@/services/trabalhos/trabalhos-service"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const getCategoryIcon = (icon?: string): LucideIcon => {
  if (!icon) return Tag
  const IconComponent = Icons[icon as keyof typeof Icons] as LucideIcon | undefined
  return IconComponent ?? Tag
}

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "2-digit",
  year: "numeric",
})

const numberFormatter = new Intl.NumberFormat("pt-BR")

type ProgressPhase = "idle" | "loading" | "fading"
const PAGE_SIZE = 10

const normalizeHexColor = (input?: string | null): string | null => {
  if (!input) return null
  const trimmed = input.trim()
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return null
  }
  if (trimmed.length === 4) {
    // #RGB -> #RRGGBB
    const r = trimmed.charAt(1)
    const g = trimmed.charAt(2)
    const b = trimmed.charAt(3)
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return trimmed.toUpperCase()
}

const getTextColorForBackground = (hexColor: string): string => {
  const r = Number.parseInt(hexColor.slice(1, 3), 16)
  const g = Number.parseInt(hexColor.slice(3, 5), 16)
  const b = Number.parseInt(hexColor.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#111827" : "#F9FAFB"
}

const getBadgeAppearance = (categoria?: Categoria) => {
  const normalizedColor = normalizeHexColor(categoria?.cor ?? null)
  if (!normalizedColor) {
    return {
      className: "border-border bg-muted text-muted-foreground",
      style: undefined as CSSProperties | undefined,
    }
  }
  return {
    className: "border-transparent text-inherit shadow-sm",
    style: {
      backgroundColor: normalizedColor,
      borderColor: normalizedColor,
      color: getTextColorForBackground(normalizedColor),
    } satisfies CSSProperties,
  }
}

export function BibliotecaPageClient() {
  const [searchTerm, setSearchTerm] = useState("")
  const [tagFilter, setTagFilter] = useState<Option[]>([])
  const [sortField, setSortField] = useState<
    "titulo" | "autor" | "visitantes" | "data_publicacao"
  >("data_publicacao")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [progress, setProgress] = useState(0)
  const [progressPhase, setProgressPhase] = useState<ProgressPhase>("idle")

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const phaseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimers = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current)
      finishTimeoutRef.current = null
    }
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current)
      phaseTimeoutRef.current = null
    }
  }, [])

  const startProgress = useCallback(() => {
    clearTimers()
    setProgress(0)
    setProgressPhase("loading")

    progressIntervalRef.current = setInterval(() => {
      setProgress((previous) => {
        if (previous >= 92) {
          return previous
        }
        const increment = Math.random() * 18 + 6
        return Math.min(previous + increment, 92)
      })
    }, 120)
  }, [clearTimers])

  const finishProgress = useCallback((delay = 420) => {
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current)
    }

    finishTimeoutRef.current = setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }

      setProgress(100)
      setProgressPhase("fading")

      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current)
      }

      phaseTimeoutRef.current = setTimeout(() => {
        setProgressPhase("idle")
        phaseTimeoutRef.current = null
      }, 350)

      finishTimeoutRef.current = null
    }, delay)
  }, [])

  const triggerProgressCycle = useCallback(
    (delay = 420) => {
      if (loading) return
      startProgress()
      finishProgress(delay)
    },
    [finishProgress, loading, startProgress],
  )

  useEffect(
    () => () => {
      clearTimers()
    },
    [clearTimers],
  )

  useEffect(() => {
    const load = async () => {
      try {
        const [trabalhosData, categoriasData] = await Promise.all([
          trabalhosService.getAll(),
          categoriasService.getAll(),
        ])
        setTrabalhos(
          trabalhosData.map((item) => ({
            ...item,
            tags: Array.isArray(item.tags) ? item.tags : [],
          })),
        )
        setCategorias(categoriasData)
      } catch (error) {
        console.error("Erro ao carregar dados da biblioteca", error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [triggerProgressCycle])

  const categoryMap = useMemo(() => {
    const entries: Array<[string, Categoria]> = []
    categorias.forEach((categoria) => {
      entries.push([categoria.id, categoria])
      entries.push([categoria.nome, categoria])
      if (categoria.slug) {
        entries.push([categoria.slug, categoria])
      }
      entries.push([slugify(categoria.nome), categoria])
    })
    return new Map(entries)
  }, [categorias])

  const tagOptions = useMemo<Option[]>(
    () =>
      categorias.map((categoria) => ({
        value: categoria.nome,
        label: categoria.nome,
      })),
    [categorias],
  )

  useEffect(() => {
    setTagFilter((prev) => prev.filter((option) => categoryMap.has(option.value)))
  }, [categoryMap])

  useEffect(() => {
    if (!loading && trabalhos.length > 0) {
      triggerProgressCycle(600)
    }
  }, [loading, trabalhos.length, triggerProgressCycle])

  const trabalhosFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase()

    return trabalhos
      .filter((trabalho) => {
        const trabalhoTags = Array.isArray(trabalho.tags) ? trabalho.tags : []

        const matchesTag =
          tagFilter.length === 0 ||
          trabalhoTags.some((tag) =>
            tagFilter.some((selected) => selected.value === tag),
          )

        if (!matchesTag) {
          return false
        }

        if (!termo) {
          return true
        }

        const matchesSearch = trabalho.titulo.toLowerCase().includes(termo)
        return matchesSearch
      })
      .sort(
        (a, b) => {
          let compare = 0

          if (sortField === "visitantes") {
            compare = a.visitantes - b.visitantes
          } else if (sortField === "data_publicacao") {
            compare =
              new Date(a.data_publicacao).getTime() - new Date(b.data_publicacao).getTime()
          } else {
            compare = a[sortField].localeCompare(b[sortField], "pt-BR", {
              sensitivity: "base",
            })
          }

          return sortOrder === "asc" ? compare : -compare
        },
      )
  }, [searchTerm, tagFilter, sortField, sortOrder, trabalhos])

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value)
      if (currentPage !== 1) {
        setCurrentPage(1)
      }
      triggerProgressCycle()
    },
    [currentPage, triggerProgressCycle],
  )

  const handleTagFilterChange = useCallback(
    (options: Option[]) => {
      setTagFilter(options)
      if (currentPage !== 1) {
        setCurrentPage(1)
      }
      triggerProgressCycle()
    },
    [currentPage, triggerProgressCycle],
  )

  const handleSort = (field: "titulo" | "autor" | "visitantes" | "data_publicacao") => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder(field === "visitantes" ? "desc" : "asc")
    }
    triggerProgressCycle()
  }

  const totalPages = Math.max(1, Math.ceil(trabalhosFiltrados.length / PAGE_SIZE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
      triggerProgressCycle()
    }
  }, [currentPage, totalPages, triggerProgressCycle])

  const paginatedTrabalhos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return trabalhosFiltrados.slice(start, start + PAGE_SIZE)
  }, [currentPage, trabalhosFiltrados])

  const visiblePages = useMemo(() => {
    const pages: number[] = []
    const maxVisible = 5
    const halfWindow = Math.floor(maxVisible / 2)

    let start = Math.max(1, currentPage - halfWindow)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }

    for (let page = start; page <= end; page += 1) {
      pages.push(page)
    }

    return pages
  }, [currentPage, totalPages])

  const summaryText = `Total de ${trabalhos.length} trabalhos cadastrados • ${trabalhosFiltrados.length} exibido(s)`
  const isProgressVisible = progressPhase !== "idle"

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages || page === currentPage) {
        return
      }
      setCurrentPage(page)
      triggerProgressCycle()
    },
    [currentPage, totalPages, triggerProgressCycle],
  )

  const getSortIcon = (field: "titulo" | "autor" | "visitantes" | "data_publicacao") => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 size-3.5 text-muted-foreground" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-2 size-3.5 text-muted-foreground" />
    ) : (
      <ArrowDown className="ml-2 size-3.5 text-muted-foreground" />
    )
  }

  const handleDelete = async (id: string, titulo: string) => {
    const shouldDelete = confirm(`Deseja realmente excluir o trabalho "${titulo}"?`)
    if (!shouldDelete) return

    try {
      await trabalhosService.delete(id)
      setTrabalhos((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Erro ao excluir trabalho", error)
      alert("Não foi possível excluir o trabalho. Tente novamente.")
    }
  }

  const handlePlaceholderAction = (message: string) => {
    alert(message)
  }

  return (
    <div className="flex-1 space-y-4 pb-10 md:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Biblioteca</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Consulte os trabalhos mais recentes publicados pela instituição.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:flex-shrink-0">
          <Button asChild className="w-full sm:w-auto whitespace-nowrap">
            <Link href="/dashboard/biblioteca/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo trabalho
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full gap-2 sm:w-auto whitespace-nowrap">
            <Link href="https://ijep.com.br/biblioteca-ijep" target="_blank" rel="noreferrer">
              <Eye className="size-4" />
              Biblioteca pública
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos trabalhos publicados</CardTitle>
          <CardDescription className="relative min-h-[24px]">
            <div
              className={cn(
                "absolute inset-0 flex items-center gap-3 transition-opacity duration-300",
                isProgressVisible ? "opacity-100" : "opacity-0 pointer-events-none",
              )}
            >
              <Progress
                value={progress}
                className="h-1.5 w-full max-w-[280px] flex-1"
                indicatorClassName="bg-primary"
              />
              <span className="text-xs text-muted-foreground">Atualizando registros…</span>
            </div>
            <span
              className={cn(
                "block transition-opacity duration-300",
                isProgressVisible ? "opacity-0" : "opacity-100",
              )}
            >
              {summaryText}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="w-full md:w-[30%]">
              <label
                htmlFor="library-search"
                className="mb-1 block text-sm font-medium text-muted-foreground"
              >
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="library-search"
                  placeholder="Buscar por título do trabalho..."
                  value={searchTerm}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full md:w-[40%]">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">
                Filtrar por tags
              </label>
              <MultipleSelector
                value={tagFilter}
                onChange={handleTagFilterChange}
                placeholder="Selecione tags"
                className="min-h-[44px]"
                options={tagOptions}
                hidePlaceholderWhenSelected
                badgeClassName="bg-primary/10 text-primary border-primary/30"
                inputProps={{
                  "aria-label": "Filtrar trabalhos por tags",
                }}
              />
              {tagFilter.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tagFilter.map((option) => {
                    const categoria = categoryMap.get(option.value)
                    const Icon = getCategoryIcon(categoria?.icone ?? undefined)
                    const appearance = getBadgeAppearance(categoria)
                    return (
                      <Badge
                        key={`filter-${option.value}`}
                        variant="outline"
                        className={appearance.className}
                        style={appearance.style}
                      >
                        <Icon className="mr-1 h-3.5 w-3.5" />
                        {categoria?.nome ?? option.label}
                      </Badge>
                    )
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-dashed border-border/70 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">Carregando trabalhos...</p>
            </div>
          ) : trabalhosFiltrados.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-foreground">Nenhum trabalho encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste sua busca ou limpe os filtros para visualizar os resultados novamente.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      role="button"
                      onClick={() => handleSort("titulo")}
                      className="min-w-[360px] cursor-pointer select-none"
                    >
                      <span className="inline-flex items-center">
                        Título
                        {getSortIcon("titulo")}
                      </span>
                    </TableHead>
                    <TableHead
                      role="button"
                      onClick={() => handleSort("autor")}
                      className="min-w-[220px] cursor-pointer select-none"
                    >
                      <span className="inline-flex items-center">
                        Autor
                        {getSortIcon("autor")}
                      </span>
                    </TableHead>
                    <TableHead className="min-w-[240px]">Tags</TableHead>
                    <TableHead
                      role="button"
                      onClick={() => handleSort("visitantes")}
                      className="w-[140px] cursor-pointer select-none text-right"
                    >
                      <span className="inline-flex items-center justify-end">
                        Visitas
                        {getSortIcon("visitantes")}
                      </span>
                    </TableHead>
                    <TableHead
                      role="button"
                      onClick={() => handleSort("data_publicacao")}
                      className="w-[96px] cursor-pointer select-none"
                    >
                      <span className="inline-flex items-center">
                        Publicado
                        {getSortIcon("data_publicacao")}
                      </span>
                    </TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTrabalhos.map((trabalho) => (
                    <TableRow key={trabalho.slug}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{trabalho.titulo}</span>
                          <Link
                            href={trabalho.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Ver publicação original
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{trabalho.autor}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(trabalho.tags) ? trabalho.tags : []).map((tag) => {
                            const categoria = categoryMap.get(tag)
                            const Icon = getCategoryIcon(categoria?.icone ?? undefined)
                            const appearance = getBadgeAppearance(categoria)
                            return (
                              <Badge
                                key={`${trabalho.slug}-${tag}`}
                                variant="outline"
                                className={appearance.className}
                                style={appearance.style}
                              >
                                <Icon className="mr-1 h-3.5 w-3.5" />
                                {categoria?.nome ?? tag}
                              </Badge>
                            )
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {numberFormatter.format(trabalho.visitantes)}
                      </TableCell>
                      <TableCell>
                        {dateFormatter.format(new Date(trabalho.data_publicacao))}
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
                              <Link href={trabalho.link} target="_blank" rel="noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/biblioteca/${trabalho.slug}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(trabalho.id, trabalho.titulo)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
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
        {!loading && trabalhosFiltrados.length > 0 ? (
          <CardFooter className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Página anterior</span>
              </Button>
              {visiblePages.map((page) => (
                <Button
                  key={`page-${page}`}
                  type="button"
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  className={cn("h-8 min-w-[2.25rem] px-2 text-xs", page === currentPage && "shadow-sm")}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Próxima página</span>
              </Button>
            </div>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  )
}
