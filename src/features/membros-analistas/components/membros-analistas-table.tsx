'use client'

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Search,
  Trash,
} from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

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
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { MembroAnalista } from "../types"
import { membrosAnalistasService } from "@/services/membros-analistas/membros-analistas-service"

function SortingButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button
      variant="ghost"
      className="px-0 font-semibold"
      onClick={onClick}
    >
      {label}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  )
}

type ProgressPhase = "idle" | "loading" | "fading"

const PAGE_SIZE = 10

export function MembrosAnalistasTable() {
  const [rows, setRows] = useState<MembroAnalista[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [details, setDetails] = useState<MembroAnalista | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [stateFilter, setStateFilter] = useState<string>("all")
  const [formationFilter, setFormationFilter] = useState<string>("all")
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

  const closeDetails = () => setDetails(null)

  const loadMembros = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      startProgress()
      const data = await membrosAnalistasService.getAll()
      setRows(data)
    } catch (err) {
      console.error("Erro ao carregar membros analistas:", err)
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os membros analistas."
      setError(message)
      toast.error("Não foi possível carregar os membros analistas.")
    } finally {
      finishProgress()
      setLoading(false)
    }
  }, [finishProgress, startProgress])

  useEffect(() => {
    void loadMembros()
  }, [loadMembros])

  useEffect(
    () => () => {
      clearTimers()
    },
    [clearTimers],
  )

  const handleDelete = async (membro: MembroAnalista) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover ${membro.nome}?`,
    )
    if (!confirmed) {
      return
    }

    try {
      await membrosAnalistasService.delete(membro.id)
      setRows((prev) =>
        prev
          .filter((item) => item.id !== membro.id)
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })),
      )
      if (details?.id === membro.id) {
        setDetails(null)
      }
      toast.success("Membro analista removido com sucesso.")
    } catch (err) {
      console.error("Erro ao remover membro analista:", err)
      toast.error("Não foi possível remover o membro analista.")
    }
  }

  const formationOptions = useMemo(() => {
    const values = new Set<string>()
    rows.forEach((row) => {
      const formation = row.tipo?.trim()
      if (formation) {
        values.add(formation)
      }
    })
    return Array.from(values).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" }),
    )
  }, [rows])

  const stateOptions = useMemo(() => {
    const values = new Set<string>()
    rows.forEach((row) => {
      const state = row.estado?.trim().toUpperCase()
      if (state && state.length === 2) {
        values.add(state)
      }
    })
    return Array.from(values).sort()
  }, [rows])

  const isProgressVisible = progressPhase !== "idle"

  useEffect(() => {
    setFormationFilter((current) => {
      if (current !== "all" && !formationOptions.includes(current)) {
        return "all"
      }
      return current
    })
  }, [formationOptions])

  useEffect(() => {
    setStateFilter((current) => {
      if (current !== "all" && !stateOptions.includes(current)) {
        return "all"
      }
      return current
    })
  }, [stateOptions])

  const columns: ColumnDef<MembroAnalista>[] = [
    {
      accessorKey: "nome",
      header: ({ column }) => (
        <SortingButton
          label="Nome"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        />
      ),
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="font-medium">{row.original.nome}</p>
          <span className="text-xs text-muted-foreground">
            Atendimento: {row.original.atendimento || "Não informado"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "tipo",
      header: ({ column }) => (
        <SortingButton
          label="Formação"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="whitespace-nowrap">
          {row.original.tipo}
        </Badge>
      ),
    },
    {
      id: "local",
      accessorFn: (row) =>
        `${row.cidade ?? ""} ${row.estado ?? ""} ${row.atendimento}`,
      header: ({ column }) => (
        <SortingButton
          label="Local"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const { cidade, estado, atendimento } = row.original
        const hasLocation = cidade || estado
        return (
          <div className="flex flex-col gap-1 text-sm">
            {hasLocation ? (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {cidade ?? ""}{cidade && estado ? " - " : ""}{estado ?? ""}
              </span>
            ) : (
              <span className="text-muted-foreground">Local não informado</span>
            )}
            <span className="text-xs text-muted-foreground">
              Atendimento: {atendimento || "Não informado"}
            </span>
          </div>
        )
      },
    },
    {
      id: "contato",
      accessorFn: (row) => `${row.telefone ?? ""} ${row.email ?? ""} ${row.linkMembro ?? ""}`,
      header: ({ column }) => (
        <SortingButton
          label="Contato"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const { telefone, email, linkMembro } = row.original
        return (
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">
              {telefone?.trim() ? telefone : "Telefone não informado"}
            </span>
            {email ? (
              <Link
                href={`mailto:${email}`}
                className="text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                {email}
              </Link>
            ) : (
              <span className="text-muted-foreground">Email não informado</span>
            )}
            {linkMembro ? (
              <Link
                href={linkMembro}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Página do membro
              </Link>
            ) : null}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => {
        const membro = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setDetails(membro)}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">Ver detalhes</span>
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              asChild
            >
              <Link href={`/dashboard/membros-analistas/${membro.id}/editar`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Link>
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={() => handleDelete(membro)}
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Remover</span>
            </Button>
          </div>
        )
      },
    },
  ]

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        row.nome.toLowerCase().includes(term) ||
        row.tipo.toLowerCase().includes(term) ||
        (row.cidade ?? "").toLowerCase().includes(term) ||
        (row.estado ?? "").toLowerCase().includes(term) ||
        (row.atendimento ?? "").toLowerCase().includes(term) ||
        (row.email ?? "").toLowerCase().includes(term) ||
        (row.telefone ?? "").toLowerCase().includes(term) ||
        (row.linkMembro ?? "").toLowerCase().includes(term) ||
        (row.descricao ?? "").toLowerCase().includes(term)

      const formationValue = row.tipo?.trim() ?? ""
      const matchesFormation =
        formationFilter === "all" || formationValue === formationFilter

      const rowState = (row.estado ?? "").trim().toUpperCase()
      const matchesState =
        stateFilter === "all" || rowState === stateFilter

      return matchesSearch && matchesFormation && matchesState
    })
  }, [formationFilter, rows, searchTerm, stateFilter])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const table = useReactTable({
    data: filteredRows,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const sortedRows = table.getRowModel().rows

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedRows.slice(start, start + PAGE_SIZE)
  }, [sortedRows, currentPage])

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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Lista de Membros Analistas</CardTitle>
          <CardDescription>
            {isProgressVisible ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">
                  Carregando membros analistas...
                </span>
                <Progress value={progress} className="h-2" />
              </div>
            ) : (
              "Carregando membros analistas cadastrados..."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Carregando dados...
          </div>
          {isProgressVisible ? (
            <div className="mt-4">
              <Progress value={progress} className="h-2 w-full max-w-sm" />
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                className="h-8 min-w-[2rem] px-2 text-xs"
                onClick={() => setCurrentPage(page)}
                disabled={page === currentPage}
              >
                {page}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Próxima página</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    )
  }

  if (error && rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Lista de Membros Analistas</CardTitle>
          <CardDescription>Não foi possível carregar os membros analistas.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
            {error}
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => void loadMembros()}>
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="text-xl">Lista de Membros Analistas</CardTitle>
          <CardDescription>
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : isProgressVisible ? (
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground">
                  Carregando membros analistas...
                </span>
                <Progress value={progress} className="h-2" />
              </div>
            ) : (
              <>
                Total de {rows.length} membros cadastrados • {filteredRows.length} exibido(s)
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid items-start gap-3 md:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, tipo, cidade, email..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 pr-16"
              />
              {searchTerm ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setCurrentPage(1)
                  }}
                  className="absolute right-2 h-7 px-2 text-xs text-muted-foreground"
                >
                  Limpar
                </Button>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end md:gap-2">
              <Select
                value={stateFilter}
                onValueChange={(value) => {
                  setStateFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-10 md:w-[40%] lg:w-[40%] xl:w-[35%]">
                  <SelectValue placeholder="Filtrar por UF" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {stateOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={formationFilter}
                onValueChange={(value) => {
                  setFormationFilter(value)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-10 md:w-[60%] lg:w-[60%] xl:w-[65%]">
                  <SelectValue placeholder="Filtrar por formação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as formações</SelectItem>
                  {formationOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setStateFilter("all")
                  setFormationFilter("all")
                  setCurrentPage(1)
                }}
                className="self-start md:self-auto"
              >
                Limpar filtros
              </Button>
            </div>
          </div>

          <div className="hidden rounded-lg border bg-background shadow-sm md:block">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {paginatedRows.length ? (
                  paginatedRows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum membro encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {paginatedRows.length ? (
              paginatedRows.map((row) => {
                const membro = row.original
                return (
                  <Card
                    key={membro.id}
                    className="border border-border/70 shadow-sm"
                  >
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start gap-3">
                        {membro.foto ? (
                          <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={membro.foto}
                              alt={membro.nome}
                              fill
                              sizes="56px"
                              className="object-cover"
                              unoptimized={membro.foto.startsWith("data:")}
                            />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
                            {membro.nome
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold leading-tight text-foreground">
                            {membro.nome}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{membro.tipo}</Badge>
                            <Badge variant="outline" className="text-xs">
                              {membro.atendimento}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <span className="font-medium text-foreground">
                          {membro.telefone ?? "Telefone não informado"}
                        </span>
                        {membro.email ? (
                          <Link
                            href={`mailto:${membro.email}`}
                            className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            {membro.email}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Email não informado
                          </span>
                        )}
                        {membro.linkMembro ? (
                          <Link
                            href={membro.linkMembro}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Página do membro
                          </Link>
                        ) : null}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {membro.cidade || membro.estado
                            ? `${membro.cidade ?? ""}${membro.cidade && membro.estado ? " - " : ""}${membro.estado ?? ""}`
                            : "Local não informado"}
                        </span>
                        <span className="text-xs">
                          Atendimento: {membro.atendimento || "Não informado"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => setDetails(membro)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalhes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center"
                          asChild
                        >
                          <Link href={`/dashboard/membros-analistas/${membro.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => handleDelete(membro)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Remover
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            ) : (
              <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
                Nenhum membro encontrado com os filtros atuais.
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                className="h-8 min-w-[2rem] px-2 text-xs"
                onClick={() => setCurrentPage(page)}
                disabled={page === currentPage}
              >
                {page}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Próxima página</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog
        open={!!details}
        onOpenChange={(open) => {
          if (!open) closeDetails()
        }}
      >
        <DialogContent className="max-w-2xl overflow-hidden border border-border/60 bg-background/95 p-0 shadow-2xl backdrop-blur-sm sm:rounded-2xl">
          {details ? (
            <div className="flex flex-col" aria-labelledby="membro-analista-title" aria-describedby="membro-analista-description">
              <div className="relative h-44 w-full overflow-hidden rounded-b-[2.5rem] sm:h-52">
                {details.foto ? (
                  <Image
                    src={details.foto}
                    alt={details.nome}
                    fill
                    sizes="100vw"
                    className="object-cover"
                    unoptimized={details.foto.startsWith("data:")}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl font-semibold text-muted-foreground">
                    {details.nome
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-6 px-6 pb-6 pt-6 sm:px-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h2
                      id="membro-analista-title"
                      className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
                    >
                      {details.nome}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-sm">
                        {details.tipo ?? "Formação não informada"}
                      </Badge>
                      <span>Atendimento: {details.atendimento || "Não informado"}</span>
                    </div>
                  </div>

                  {details.linkMembro ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                      className="h-9 rounded-full border-primary/40 text-primary hover:bg-primary/10"
                    >
                      <Link href={details.linkMembro} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Ver perfil
                      </Link>
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex min-h-[96px] items-start gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                    <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Local
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {details.cidade || details.estado
                          ? `${details.cidade ?? ""}${details.cidade && details.estado ? " - " : ""}${details.estado ?? ""}`
                          : "Não informado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-h-[96px] items-start gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                    <Phone className="mt-1 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Telefone
                      </p>
                      <p className="mt-1 text-sm text-foreground">
                        {details.telefone?.trim()?.length ? details.telefone : "Não informado"}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-h-[96px] items-start gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                    <Mail className="mt-1 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Email
                      </p>
                      {details.email ? (
                        <Link
                          href={`mailto:${details.email}`}
                          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                        >
                          {details.email}
                        </Link>
                      ) : (
                        <p className="mt-1 text-sm text-foreground">Não informado</p>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  id="membro-analista-description"
                  className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3 sm:px-5 sm:py-4"
                >
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Descrição
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {details.descricao?.trim()?.length
                      ? details.descricao
                      : "Sem descrição disponível."}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
