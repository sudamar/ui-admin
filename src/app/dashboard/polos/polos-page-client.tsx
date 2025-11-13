'use client'

import type { CheckedState } from "@radix-ui/react-checkbox"
import { useEffect, useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Building, Eye, MapPin, Pencil, Phone, Plus, Trash2 } from "lucide-react"

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { polosService, type Polo } from "@/services/polos/polos-service"

const createPoloSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Informe um identificador (slug) com pelo menos 2 caracteres.")
    .max(100, "O slug pode ter no máximo 100 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens (ex: belo-horizonte)",
    ),
  name: z
    .string()
    .min(1, "Informe o nome do polo.")
    .min(3, "O nome precisa ter ao menos 3 caracteres."),
  address: z
    .string()
    .trim()
    .min(5, "Informe um endereço válido.")
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(8, "Informe um telefone válido.")
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .or(z.literal("")),
  coordinator: z
    .string()
    .trim()
    .min(3, "Informe um nome válido.")
    .or(z.literal("")),
  mapUrl: z
    .string()
    .trim()
    .url("Informe uma URL válida para o mapa.")
    .or(z.literal("")),
})

type CreatePoloFormValues = z.infer<typeof createPoloSchema>

export function PolosPageClient() {
  const [polos, setPolos] = useState<Polo[]>([])
  const [filteredPolos, setFilteredPolos] = useState<Polo[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [poloDetails, setPoloDetails] = useState<Polo | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPolos, setSelectedPolos] = useState<string[]>([])

  const createForm = useForm<CreatePoloFormValues>({
    resolver: zodResolver(createPoloSchema),
    defaultValues: {
      slug: "",
      name: "",
      address: "",
      phone: "",
      email: "",
      coordinator: "",
      mapUrl: "",
    },
  })

  useEffect(() => {
    const loadPolos = async () => {
      setLoading(true)
      try {
        const data = await polosService.getAll()
        setPolos(data)
      } catch (error) {
        console.error("Erro ao carregar polos:", error)
        toast.error("Não foi possível carregar os polos.")
      } finally {
        setLoading(false)
      }
    }
    loadPolos()
  }, [])

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase()
    const filtered = polos.filter((polo) => {
      const haystack = [
        polo.slug,
        polo.name,
        polo.address ?? "",
        polo.coordinator ?? "",
        polo.email ?? "",
        polo.phone ?? "",
      ]

      return (
        term.length === 0 ||
        haystack.some((value) => value.toLowerCase().includes(term))
      )
    })

    setFilteredPolos(filtered)
  }, [polos, searchTerm])

  useEffect(() => {
    setSelectedPolos((prev) =>
      prev.filter((id) => filteredPolos.some((polo) => polo.id === id))
    )
  }, [filteredPolos])

  const handleCreate = async (values: CreatePoloFormValues) => {
    setCreating(true)
    try {
      const newPolo = await polosService.create({
        slug: values.slug,
        name: values.name,
        address: values.address || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        coordinator: values.coordinator || undefined,
        mapUrl: values.mapUrl || undefined,
      })

      setPolos((prev) => [newPolo, ...prev])
      toast.success("Polo cadastrado com sucesso!")
      setCreateDialogOpen(false)
      createForm.reset({
        slug: "",
        name: "",
        address: "",
        phone: "",
        email: "",
        coordinator: "",
        mapUrl: "",
      })
    } catch (error) {
      console.error("Erro ao criar polo:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o polo."
      )
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este polo?")) return
    try {
      const deleted = await polosService.delete(id)
      if (!deleted) {
        toast.error("Não foi possível remover o polo.")
        return
      }

      setPolos((prev) => prev.filter((item) => item.id !== id))
      toast.success("Polo removido com sucesso.")
    } catch (error) {
      console.error("Erro ao remover polo:", error)
      toast.error("Ocorreu um erro ao remover o polo.")
    }
  }

  const handleSelectAll = (checked: CheckedState) => {
    const isChecked = checked === true
    if (isChecked) {
      setSelectedPolos(filteredPolos.map((polo) => polo.id))
    } else {
      setSelectedPolos([])
    }
  }

  const handleSelect = (id: string, checked: CheckedState) => {
    const isChecked = checked === true
    setSelectedPolos((prev) => {
      if (isChecked) {
        return prev.includes(id) ? prev : [...prev, id]
      }
      return prev.filter((item) => item !== id)
    })
  }

  const handleBulkDelete = async () => {
    if (selectedPolos.length === 0) return
    if (
      !confirm(
        `Tem certeza que deseja remover ${selectedPolos.length} polo(s) selecionado(s)?`
      )
    )
      return

    try {
      for (const id of selectedPolos) {
        await polosService.delete(id)
      }
      setPolos((prev) => prev.filter((polo) => !selectedPolos.includes(polo.id)))
      setSelectedPolos([])
      toast.success("Polos selecionados removidos com sucesso.")
    } catch (error) {
      console.error("Erro ao remover polos:", error)
      toast.error("Não foi possível remover todos os polos selecionados.")
    }
  }

  const openDetails = (polo: Polo) => {
    setPoloDetails(polo)
    setDetailsDialogOpen(true)
  }

  const closeDetails = () => {
    setDetailsDialogOpen(false)
    setPoloDetails(null)
  }

  const isAllSelected =
    filteredPolos.length > 0 && selectedPolos.length === filteredPolos.length
  const isIndeterminate =
    selectedPolos.length > 0 && selectedPolos.length < filteredPolos.length

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">
            Carregando polos acadêmicos...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 space-y-4 md:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Polos Acadêmicos
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Gerencie os polos presenciais da instituição
            </p>
          </div>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                Novo polo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
              <DialogHeader className="space-y-2">
                <DialogTitle className="text-lg sm:text-xl">Adicionar novo polo</DialogTitle>
                <DialogDescription className="text-sm">
                  Informe os dados principais do polo para que ele apareça no
                  dashboard.
                </DialogDescription>
              </DialogHeader>

              <form
                className="grid gap-4"
                onSubmit={createForm.handleSubmit(handleCreate)}
              >
                <div className="grid gap-2">
                  <label htmlFor="slug" className="text-sm font-medium">
                    Slug (identificador) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="slug"
                    placeholder="belo-horizonte"
                    {...createForm.register("slug")}
                  />
                  {createForm.formState.errors.slug ? (
                    <p className="text-sm text-destructive">
                      {createForm.formState.errors.slug.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Nome do polo <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="name"
                    placeholder="Ex.: Polo Belo Horizonte"
                    {...createForm.register("name")}
                  />
                  {createForm.formState.errors.name ? (
                    <p className="text-sm text-destructive">
                      {createForm.formState.errors.name.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <label htmlFor="address" className="text-sm font-medium">
                    Endereço
                  </label>
                  <Textarea
                    id="address"
                    placeholder="Rua Exemplo, 123 - Centro, Cidade - UF"
                    rows={2}
                    {...createForm.register("address")}
                  />
                  {createForm.formState.errors.address ? (
                    <p className="text-sm text-destructive">
                      {createForm.formState.errors.address.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label htmlFor="phone" className="text-sm font-medium">
                      Telefone
                    </label>
                    <Input
                      id="phone"
                      placeholder="(31) 3333-4444"
                      {...createForm.register("phone")}
                    />
                    {createForm.formState.errors.phone ? (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.phone.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      E-mail
                    </label>
                    <Input
                      id="email"
                      placeholder="contato@fafih.edu.br"
                      type="email"
                      {...createForm.register("email")}
                    />
                    {createForm.formState.errors.email ? (
                      <p className="text-sm text-destructive">
                        {createForm.formState.errors.email.message}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-2">
                  <label htmlFor="coordinator" className="text-sm font-medium">
                    Coordenador(a)
                  </label>
                  <Input
                    id="coordinator"
                    placeholder="Prof. Responsável"
                    {...createForm.register("coordinator")}
                  />
                  {createForm.formState.errors.coordinator ? (
                    <p className="text-sm text-destructive">
                      {createForm.formState.errors.coordinator.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <label htmlFor="mapUrl" className="text-sm font-medium">
                    URL do mapa
                  </label>
                  <Input
                    id="mapUrl"
                    placeholder="https://maps.google.com/?q=..."
                    {...createForm.register("mapUrl")}
                  />
                  {createForm.formState.errors.mapUrl ? (
                    <p className="text-sm text-destructive">
                      {createForm.formState.errors.mapUrl.message}
                    </p>
                  ) : null}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      createForm.reset({
                        slug: "",
                        name: "",
                        address: "",
                        phone: "",
                        email: "",
                        coordinator: "",
                        mapUrl: "",
                      })
                      setCreateDialogOpen(false)
                    }}
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Salvando..." : "Salvar polo"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Lista de polos</CardTitle>
          <CardDescription>
            Total de {polos.length} polos cadastrados • {filteredPolos.length} exibido(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:gap-4 md:grid-cols-2 md:items-end">
            <div className="flex flex-col gap-1 md:col-span-1">
              <Label htmlFor="polo-search" className="text-sm font-medium text-foreground">
                Buscar
              </Label>
              <Input
                id="polo-search"
                placeholder="Buscar por slug, nome ou contato..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          {selectedPolos.length > 0 ? (
            <div className="hidden items-center justify-between rounded-md bg-primary/5 px-4 py-2 text-sm md:flex">
              <span>
                <strong>{selectedPolos.length}</strong> polo(s) selecionado(s).
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedPolos([])}>
                  Limpar seleção
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  Remover selecionados
                </Button>
              </div>
            </div>
          ) : null}

          {filteredPolos.length === 0 ? (
            <div className="rounded-md border border-dashed border-border/70 px-6 py-12 text-center">
              <Building className="mx-auto h-8 w-8 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                Nenhum polo encontrado
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste os filtros ou cadastre um novo polo para visualizar a lista.
              </p>
            </div>
          ) : null}

          {filteredPolos.length > 0 ? (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[48px]">
                        <Checkbox
                          checked={
                            isAllSelected ? true : isIndeterminate ? "indeterminate" : false
                        }
                        onCheckedChange={(checked) => handleSelectAll(checked)}
                        aria-label="Selecionar todos os polos"
                      />
                    </TableHead>
                    <TableHead className="min-w-[140px]">Identificador</TableHead>
                    <TableHead className="min-w-[220px]">Polo</TableHead>
                    <TableHead className="min-w-[160px]">Coordenador(a)</TableHead>
                    <TableHead className="min-w-[180px]">Contato</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPolos.map((polo) => (
                      <TableRow key={polo.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedPolos.includes(polo.id)}
                          onCheckedChange={(checked) => handleSelect(polo.id, checked)}
                          aria-label={`Selecionar polo ${polo.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {polo.slug}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">{polo.name}</span>
                          {polo.address ? (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {polo.address}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Endereço não informado</span>
                          )}
                          {polo.mapUrl ? (
                            <Link
                              href={polo.mapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              Ver no mapa
                            </Link>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {polo.coordinator ?? "Coordenador não informado"}
                          </span>
                          <span className="text-xs text-muted-foreground">Coordenação local</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          {polo.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-primary" />
                              {polo.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Telefone não informado</span>
                          )}
                          {polo.email ? (
                            <Link
                              href={`mailto:${polo.email}`}
                              className="text-xs text-primary hover:underline"
                            >
                              {polo.email}
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">E-mail não informado</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => openDetails(polo)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver detalhes</span>
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" asChild>
                            <Link href={`/dashboard/polos/${polo.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-8 w-8"
                            onClick={() => handleDelete(polo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir polo</span>
                          </Button>
                        </div>
                      </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={6} className="text-right text-sm text-muted-foreground">
                        Exibindo {filteredPolos.length} de {polos.length} polos cadastrados.
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {filteredPolos.map((polo) => (
                  <Card key={polo.id} className="border border-border/70 shadow-sm">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedPolos.includes(polo.id)}
                          onCheckedChange={(checked) => handleSelect(polo.id, checked)}
                          aria-label={`Selecionar polo ${polo.name}`}
                        />
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-foreground">{polo.name}</h3>
                              <Badge variant="outline" className="font-mono text-xs">
                                {polo.slug}
                              </Badge>
                            </div>
                            {polo.address ? (
                              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                {polo.address}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground">Endereço não informado</p>
                            )}
                            {polo.mapUrl ? (
                              <Link
                                href={polo.mapUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                Ver no mapa
                              </Link>
                            ) : null}
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">Coordenação</span>
                              <span>{polo.coordinator ?? "Não informado"}</span>
                            </div>
                            <div className="space-y-1">
                              <span className="font-medium text-foreground">Contato</span>
                              <div className="flex flex-col text-sm">
                                {polo.phone ? (
                                  <span className="flex items-center gap-2 text-foreground">
                                    <Phone className="h-4 w-4 text-primary" />
                                    {polo.phone}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    Telefone não informado
                                  </span>
                                )}
                                {polo.email ? (
                                  <Link
                                    href={`mailto:${polo.email}`}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    {polo.email}
                                  </Link>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    E-mail não informado
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center sm:w-auto"
                          onClick={() => openDetails(polo)}
                        >
                          Ver detalhes
                        </Button>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => openDetails(polo)}
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Ver detalhes</span>
                          </Button>
                          {polo.mapUrl ? (
                            <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                              <Link href={polo.mapUrl} target="_blank" rel="noreferrer">
                                <MapPin className="h-4 w-4" />
                                <span className="sr-only">Ver mapa</span>
                              </Link>
                            </Button>
                          ) : null}
                          <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                            <Link href={`/dashboard/polos/${polo.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Link>
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => handleDelete(polo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Excluir polo</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <div className="text-right text-sm text-muted-foreground">
                  Exibindo {filteredPolos.length} de {polos.length} polos cadastrados.
                </div>
                {selectedPolos.length > 0 ? (
                  <div className="flex flex-col gap-2 rounded-md bg-primary/5 p-3 text-sm">
                    <span className="text-foreground">
                      <strong>{selectedPolos.length}</strong> polo(s) selecionado(s)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedPolos([])}
                      >
                        Limpar seleção
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={handleBulkDelete}
                      >
                        Remover selecionados
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
      </div>
      <Dialog
        open={detailsDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDetails()
          } else {
            setDetailsDialogOpen(true)
          }
        }}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="break-words text-lg sm:text-xl">
              {poloDetails ? poloDetails.name : "Detalhes do polo"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Informações completas do polo selecionado.
            </DialogDescription>
          </DialogHeader>

          {poloDetails ? (
            <div className="grid gap-3 sm:gap-4">
              <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Identificador</h4>
                <p className="mt-1 break-words font-mono text-sm uppercase text-foreground">
                  {poloDetails.slug}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Endereço</h4>
                <p className="mt-1 break-words text-sm">
                  {poloDetails.address ?? "Endereço não informado"}
                </p>
                {poloDetails.mapUrl ? (
                  <Link
                    href={poloDetails.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Ver no mapa
                  </Link>
                ) : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contato</h4>
                  <p className="mt-1 break-words text-sm">
                    {poloDetails.phone ?? "Telefone não informado"}
                  </p>
                  {poloDetails.email ? (
                    <Link
                      href={`mailto:${poloDetails.email}`}
                      className="mt-1 block break-all text-xs text-primary hover:underline"
                    >
                      {poloDetails.email}
                    </Link>
                  ) : (
                    <span className="mt-1 block text-xs text-muted-foreground">
                      E-mail não informado
                    </span>
                  )}
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Coordenação</h4>
                  <p className="mt-1 break-words text-sm">
                    {poloDetails.coordinator ?? "Não informado"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" onClick={closeDetails} size="default">
                  Fechar
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
