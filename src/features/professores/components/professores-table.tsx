'use client'

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Pencil, Search, Trash } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { Professor } from "../types"
import { professoresService } from "@/services/professores/professores-service"

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

export function ProfessoresTable() {
  const [rows, setRows] = useState<Professor[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [detailsProfessor, setDetailsProfessor] = useState<Professor | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const PAGE_SIZE = 10

  const closeDetails = () => setDetailsProfessor(null)

  const loadProfessores = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await professoresService.getAll()
      const sorted = [...data].sort((a, b) =>
        a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
      )
      setRows(sorted)
    } catch (err) {
      console.error("Erro ao carregar professores:", err)
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os professores."
      setError(message)
      toast.error("Não foi possível carregar os professores.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfessores()
  }, [loadProfessores])

  const handleDelete = async (professor: Professor) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover ${professor.nome}?`,
    )
    if (!confirmed) {
      return
    }

    try {
      await professoresService.delete(professor.id)
      setRows((prev) =>
        prev
          .filter((item) => item.id !== professor.id)
          .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }))
      )
      if (detailsProfessor?.id === professor.id) {
        setDetailsProfessor(null)
      }
      toast.success("Professor removido com sucesso.")
    } catch (err) {
      console.error("Erro ao remover professor:", err)
      toast.error("Não foi possível remover o professor.")
    }
  }

  const columns: ColumnDef<Professor>[] = [
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
        <div>
          <p className="font-medium">{row.original.nome}</p>
          <p className="text-sm text-muted-foreground">
            {row.original.titulacao || "Titulação não informada"}
          </p>
        </div>
      ),
    },
    {
      id: "contato",
      accessorFn: (row) => `${row.telefone ?? ""} ${row.email ?? ""}`,
      header: ({ column }) => (
        <SortingButton
          label="Contato"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        />
      ),
      cell: ({ row }) => {
        const { telefone, email, linkProfessor } = row.original
        return (
          <div className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">
              {telefone?.trim() && telefone.length > 0
                ? telefone
                : "Telefone não informado"}
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
            {linkProfessor ? (
              <Link
                href={linkProfessor}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline"
              >
                Página do professor
              </Link>
            ) : null}
          </div>
        )
      },
    },
    {
      accessorKey: "descricao",
      header: ({ column }) => (
        <SortingButton
          label="Descrição"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        />
      ),
      cell: ({ row }) => (
        <p className="line-clamp-2 max-w-xl text-sm text-muted-foreground">
          {row.original.descricao || "Sem descrição disponível."}
        </p>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      enableSorting: false,
      cell: ({ row }) => {
        const professor = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => setDetailsProfessor(professor)}
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
              <Link href={`/dashboard/professores/${professor.id}/editar`}>
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Editar</span>
              </Link>
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-8 w-8"
              onClick={() => handleDelete(professor)}
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
        (row.email ?? "").toLowerCase().includes(term) ||
        (row.telefone ?? "").toLowerCase().includes(term) ||
        (row.linkProfessor ?? "").toLowerCase().includes(term)

      return matchesSearch
    })
  }, [rows, searchTerm])

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
          <CardTitle className="text-xl">Lista de Professores</CardTitle>
          <CardDescription>Carregando professores cadastrados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Carregando dados...
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
    )
  }

  if (error && rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Lista de Professores</CardTitle>
          <CardDescription>Não foi possível carregar os professores.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
            {error}
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => void loadProfessores()}>
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
          <CardTitle className="text-xl">Lista de Professores</CardTitle>
          <CardDescription>
            {error ? (
              <span className="text-destructive">{error}</span>
            ) : (
              <>
                Total de {rows.length} professores cadastrados • {filteredRows.length} exibido(s)
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr] lg:grid-cols-[2fr_1fr_1fr]">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone, email ou link..."
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
                              header.getContext()
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
                            cell.getContext()
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
                      Nenhum professor encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {paginatedRows.length ? (
              paginatedRows.map((row) => {
                const professor = row.original
                return (
                  <Card
                    key={professor.id}
                    className="border border-border/70 shadow-sm"
                  >
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start gap-3">
                        {professor.foto ? (
                          <div className="relative h-14 w-14 overflow-hidden rounded-md bg-muted">
                            <Image
                              src={professor.foto}
                              alt={professor.nome}
                              fill
                              sizes="56px"
                              className="object-cover"
                              unoptimized={professor.foto.startsWith("data:")}
                            />
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
                            {professor.nome
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold leading-tight text-foreground">
                            {professor.nome}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {professor.titulacao || "Titulação não informada"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {professor.descricao || "Sem descrição cadastrada."}
                      </p>
                      <div className="space-y-1 text-sm">
                        <span className="font-medium text-foreground">
                          {professor.telefone ?? "Telefone não informado"}
                        </span>
                        {professor.email ? (
                          <Link
                            href={`mailto:${professor.email}`}
                            className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                          >
                            {professor.email}
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Email não informado
                          </span>
                        )}
                        {professor.linkProfessor ? (
                          <Link
                            href={professor.linkProfessor}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            Página do professor
                          </Link>
                        ) : null}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => setDetailsProfessor(professor)}
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
                          <Link href={`/dashboard/professores/${professor.id}/editar`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full justify-center"
                          onClick={() => handleDelete(professor)}
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
                Nenhum professor encontrado com os filtros atuais.
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
        open={!!detailsProfessor}
        onOpenChange={(open) => {
          if (!open) closeDetails()
        }}
      >
        <DialogContent>
          {detailsProfessor ? (
            <>
              <DialogHeader>
                <DialogTitle>{detailsProfessor.nome}</DialogTitle>
                <DialogDescription>
                  {detailsProfessor.titulacao || "Titulação não informada"}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                {detailsProfessor.foto ? (
                  <div className="relative h-32 w-full overflow-hidden rounded-md bg-muted sm:h-48">
                    <Image
                      src={detailsProfessor.foto}
                      alt={detailsProfessor.nome}
                      fill
                      sizes="100vw"
                      className="object-cover"
                      unoptimized={detailsProfessor.foto.startsWith("data:")}
                    />
                  </div>
                ) : null}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Telefone: </span>
                    <span className="text-muted-foreground">
                      {detailsProfessor.telefone || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Email: </span>
                    {detailsProfessor.email ? (
                      <Link
                        href={`mailto:${detailsProfessor.email}`}
                        className="text-emerald-600 hover:text-emerald-700 hover:underline"
                      >
                        {detailsProfessor.email}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">Não informado</span>
                    )}
                  </div>
                  {detailsProfessor.linkProfessor ? (
                    <div>
                      <span className="font-medium">Página: </span>
                      <Link
                        href={detailsProfessor.linkProfessor}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Acessar perfil
                      </Link>
                    </div>
                  ) : null}
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold uppercase text-muted-foreground">
                    Descrição
                  </h4>
                  <p className="text-sm leading-relaxed">
                    {detailsProfessor.descricao || "Sem descrição disponível."}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
