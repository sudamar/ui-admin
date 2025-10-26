'use client'

import type { CheckedState } from "@radix-ui/react-checkbox"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import {
  Building,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Trash2,
} from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { polosService, type Polo } from "@/services/polos/polos-service"

const createPoloSchema = z.object({
  name: z
    .string()
    .min(1, "Informe o nome do polo.")
    .min(3, "O nome precisa ter ao menos 3 caracteres."),
  address: z
    .string()
    .min(1, "Informe o endereço.")
    .min(5, "Informe um endereço válido."),
  phone: z
    .string()
    .min(1, "Informe o telefone.")
    .min(8, "Informe um telefone válido."),
  email: z
    .string()
    .min(1, "Informe o e-mail.")
    .email("Informe um e-mail válido."),
  coordinator: z
    .string()
    .min(1, "Informe o(a) coordenador(a).")
    .min(3, "Informe um nome válido."),
  mapUrl: z.string().url("Informe uma URL válida para o mapa.").optional().or(z.literal("")),
  courses: z
    .string()
    .min(1, "Informe pelo menos um curso.")
    .min(3, "Informe pelo menos um curso."),
})

type CreatePoloFormValues = z.infer<typeof createPoloSchema>

export default function PolosPage() {
  const [polos, setPolos] = useState<Polo[]>([])
  const [filteredPolos, setFilteredPolos] = useState<Polo[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [poloDetails, setPoloDetails] = useState<Polo | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [courseFilter, setCourseFilter] = useState<string>("all")
  const [selectedPolos, setSelectedPolos] = useState<string[]>([])

  const createForm = useForm<CreatePoloFormValues>({
    resolver: zodResolver(createPoloSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      coordinator: "",
      mapUrl: "",
      courses: "",
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
      const matchesSearch =
        term.length === 0 ||
        polo.name.toLowerCase().includes(term) ||
        polo.address.toLowerCase().includes(term) ||
        polo.coordinator.toLowerCase().includes(term) ||
        polo.email.toLowerCase().includes(term) ||
        polo.phone.toLowerCase().includes(term)

      const matchesCourse =
        courseFilter === "all" ||
        polo.courses.some(
          (course) => course.toLowerCase() === courseFilter.toLowerCase()
        )

      return matchesSearch && matchesCourse
    })

      setFilteredPolos(filtered)
    }, [polos, searchTerm, courseFilter])

  useEffect(() => {
    setSelectedPolos((prev) =>
      prev.filter((id) => filteredPolos.some((polo) => polo.id === id))
    )
  }, [filteredPolos])

  const courses = useMemo(() => {
    const allCourses = polos.flatMap((polo) => polo.courses)
    return Array.from(new Set(allCourses)).sort((a, b) =>
      a.localeCompare(b, "pt-BR", { sensitivity: "base" })
    )
  }, [polos])

  const handleCreate = async (values: CreatePoloFormValues) => {
    setCreating(true)
    try {
      const coursesList = values.courses
        .split(/[\n,]/)
        .map((course) => course.trim())
        .filter(Boolean)

      if (coursesList.length === 0) {
        createForm.setError("courses", {
          message: "Informe pelo menos um curso.",
        })
        setCreating(false)
        return
      }

      const newPolo = await polosService.create({
        name: values.name,
        address: values.address,
        phone: values.phone,
        email: values.email,
        coordinator: values.coordinator,
        mapUrl: values.mapUrl?.trim() ? values.mapUrl.trim() : undefined,
        courses: coursesList,
      })

      setPolos((prev) => [newPolo, ...prev])
      toast.success("Polo cadastrado com sucesso!")
      setCreateDialogOpen(false)
      createForm.reset()
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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar novo polo</DialogTitle>
                <DialogDescription>
                  Informe os dados principais do polo para que ele apareça no
                  dashboard.
                </DialogDescription>
              </DialogHeader>

              <form
                className="grid gap-4"
                onSubmit={createForm.handleSubmit(handleCreate)}
              >
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome do polo <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="Ex.: Belo Horizonte - MG"
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
                  Endereço <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="address"
                  placeholder="Rua Exemplo, 123 - Centro, Belo Horizonte - MG"
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
                    Telefone <span className="text-destructive">*</span>
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
                    E-mail <span className="text-destructive">*</span>
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
                  Coordenador(a) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="coordinator"
                  placeholder="Prof. Dr. João Silva"
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

              <div className="grid gap-2">
                <label htmlFor="courses" className="text-sm font-medium">
                  Cursos oferecidos <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="courses"
                  rows={3}
                  placeholder="Informe um curso por linha ou separados por vírgula"
                  {...createForm.register("courses")}
                />
                {createForm.formState.errors.courses ? (
                  <p className="text-sm text-destructive">
                    {createForm.formState.errors.courses.message}
                  </p>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    createForm.reset()
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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-sm">
              <Input
                placeholder="Buscar por nome, cidade ou contato..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex w-full flex-col gap-2 text-sm text-muted-foreground md:w-auto md:flex-row md:items-center md:gap-4">
              <span className="font-medium text-foreground">Filtrar por curso:</span>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full min-w-[200px] md:w-56">
                  <SelectValue placeholder="Todos os cursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPolos.length > 0 ? (
            <div className="flex items-center justify-between rounded-md bg-primary/5 px-4 py-2 text-sm">
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
          ) : (
            <div className="overflow-x-auto">
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
                    <TableHead className="min-w-[180px]">Polo</TableHead>
                    <TableHead className="min-w-[140px]">Coordenador(a)</TableHead>
                    <TableHead className="min-w-[160px]">Contato</TableHead>
                    <TableHead className="min-w-[220px]">Cursos</TableHead>
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
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">{polo.name}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {polo.address}
                          </span>
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
                          <span className="font-medium">{polo.coordinator}</span>
                          <span className="text-xs text-muted-foreground">Coordenação local</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                            {polo.phone}
                          </span>
                          <Link
                            href={`mailto:${polo.email}`}
                            className="text-xs text-primary hover:underline"
                          >
                            {polo.email}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          {polo.courses.map((course) => (
                            <Badge key={course} variant="outline" className="text-xs font-medium">
                              {course}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openDetails(polo)}>
                              Ver detalhes
                            </DropdownMenuItem>
                            {polo.mapUrl ? (
                              <DropdownMenuItem asChild>
                                <Link href={polo.mapUrl} target="_blank" rel="noreferrer">
                                  Ver mapa
                                </Link>
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(polo.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir polo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
          )}
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {poloDetails ? poloDetails.name : "Detalhes do polo"}
            </DialogTitle>
            <DialogDescription>
              Informações completas do polo selecionado.
            </DialogDescription>
          </DialogHeader>

          {poloDetails ? (
            <div className="grid gap-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Endereço</h4>
                <p className="mt-1 text-sm">{poloDetails.address}</p>
                {poloDetails.mapUrl ? (
                  <Link
                    href={poloDetails.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Ver no mapa
                  </Link>
                ) : null}
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Contato</h4>
                  <p className="mt-1 text-sm">{poloDetails.phone}</p>
                  <Link
                    href={`mailto:${poloDetails.email}`}
                    className="text-xs text-primary hover:underline"
                  >
                    {poloDetails.email}
                  </Link>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground">Coordenação</h4>
                  <p className="mt-1 text-sm">{poloDetails.coordinator}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground">Cursos oferecidos</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {poloDetails.courses.map((course) => (
                    <Badge key={course} variant="outline">
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={closeDetails}>
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
