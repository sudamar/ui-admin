"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Eye, Pencil, Search, Trash } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { Professor } from "../types"
import {
  markProfessorDeleted,
  mergeWithOverrides,
  PROFESSORES_STORAGE_KEY,
  readProfessorOverrides,
} from "../storage"

type ProfessoresTableProps = {
  data: Professor[]
}

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

export function ProfessoresTable({ data }: ProfessoresTableProps) {
  const [rows, setRows] = useState<Professor[]>(() => data)
  const [sorting, setSorting] = useState<SortingState>([])
  const [detailsProfessor, setDetailsProfessor] = useState<Professor | null>(
    null
  )
  const [searchTerm, setSearchTerm] = useState("")
  const [titleFilter, setTitleFilter] = useState("all")

  const closeDetails = () => setDetailsProfessor(null)

  useEffect(() => {
    const overrides = readProfessorOverrides()
    setRows(mergeWithOverrides(data, overrides))
  }, [data])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== PROFESSORES_STORAGE_KEY) {
        return
      }
      const overrides = readProfessorOverrides()
      setRows((current) => mergeWithOverrides(current, overrides))
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  useEffect(() => {
    const handleFocus = () => {
      const overrides = readProfessorOverrides()
      setRows(mergeWithOverrides(data, overrides))
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [data])

  const handleDelete = (professor: Professor) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover ${professor.nome}?`
    )
    if (!confirmed) {
      return
    }
    setRows((prev) => prev.filter((item) => item.id !== professor.id))
    markProfessorDeleted(professor.id)
    if (detailsProfessor?.id === professor.id) {
      setDetailsProfessor(null)
    }
    toast.success("Professor removido com sucesso.")
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
            {row.original.titulacao}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <SortingButton
          label="Email"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.email || "—"}
        </span>
      ),
    },
    {
      accessorKey: "telefone",
      header: ({ column }) => (
        <SortingButton
          label="Telefone"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.telefone || "—"}
        </span>
      ),
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
          {row.original.descricao}
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

  const uniqueTitles = useMemo(() => {
    const values = Array.from(
      new Set(
        rows
          .map((item) => item.titulacao.trim())
          .filter((value) => value.length > 0)
      )
    )
    return values.sort((a, b) => a.localeCompare(b))
  }, [rows])

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    return rows.filter((row) => {
      const matchesSearch =
        term.length === 0 ||
        row.nome.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        row.telefone.toLowerCase().includes(term)

      const matchesTitle =
        titleFilter === "all" || row.titulacao === titleFilter

      return matchesSearch && matchesTitle
    })
  }, [rows, searchTerm, titleFilter])

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

  return (
    <>
      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="text-xl">Lista de Professores</CardTitle>
          <CardDescription>
            Total de {rows.length} professores cadastrados •{" "}
            {filteredRows.length} exibido(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-[2fr_1fr] lg:grid-cols-[2fr_1fr_1fr]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={titleFilter} onValueChange={setTitleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por titulação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as titulações</SelectItem>
                {uniqueTitles.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="hidden lg:block" />
          </div>

          <div className="hidden max-h-[560px] overflow-auto rounded-lg border bg-background shadow-sm md:block">
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
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
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
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => {
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
                        <div>
                          <p className="font-semibold leading-tight text-foreground">
                            {professor.nome}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {professor.titulacao}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {professor.email || "Email não informado"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {professor.descricao}
                      </p>
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
                  {detailsProfessor.titulacao}
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
                    <span className="font-medium">Email: </span>
                    <span className="text-muted-foreground">
                      {detailsProfessor.email || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Telefone: </span>
                    <span className="text-muted-foreground">
                      {detailsProfessor.telefone || "Não informado"}
                    </span>
                  </div>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold uppercase text-muted-foreground">
                    Descrição
                  </h4>
                  <p className="text-sm leading-relaxed">
                    {detailsProfessor.descricao}
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
