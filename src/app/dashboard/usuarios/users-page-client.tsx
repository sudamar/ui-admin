"use client"

import { useEffect, useState, useMemo, type ReactNode } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { ArrowDown, ArrowUp, ArrowUpDown, Edit, Eye, MoreHorizontal, Search, Trash2, UserPlus } from "lucide-react"

import { usersService, type User } from "@/services/usuarios/usuario-service"

type SortField = "name" | "email" | "role" | "status" | "createdAt"
type SortOrder = "asc" | "desc"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "Admin":
      return "default"
    case "Editor":
      return "secondary"
    default:
      return "outline"
  }
}

interface UserDetailsDialogProps {
  user: User
  trigger: ReactNode
  onDelete: (id: number) => void
}

function UserDetailsDialog({ user, trigger, onDelete }: UserDetailsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="bg-white sm:max-w-[480px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Detalhes do Usuário</DialogTitle>
          <DialogDescription>
            Informações completas sobre{" "}
            <span className="font-medium text-foreground">{user.name}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 pt-2">
          <div className="flex items-center gap-4 rounded-lg bg-gray-50 p-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-lg text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="grid gap-4 text-sm">
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Perfil:</span>
              <Badge variant={getRoleBadgeVariant(user.role) as any}>{user.role}</Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={user.status === "active" ? "default" : "secondary"}>
                {user.status === "active" ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Cadastrado em:</span>
              <span className="font-medium">{new Date(user.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button asChild className="flex-1" size="lg">
              <Link href={`/dashboard/usuarios/${user.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              size="lg"
              onClick={() => onDelete(user.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remover
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function UsersPageClient() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await usersService.getAll()
      setUsers(data)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return

    try {
      await usersService.delete(id)
      setUsers((prev) => prev.filter((user) => user.id !== id))
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
    }
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map((u) => u.id))
    }
  }

  const toggleSelectUser = (id: number) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((userId) => userId !== id) : [...prev, id]
    )
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRole = roleFilter === "all" || user.role === roleFilter
      const matchesStatus = statusFilter === "all" || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })

    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === "createdAt") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [users, searchTerm, roleFilter, statusFilter, sortField, sortOrder])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Usuários</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Gerencie os usuários do sistema
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/usuarios/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Total de {users.length} usuários cadastrados • {filteredAndSortedUsers.length} exibido(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 md:mb-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="relative md:col-span-2 xl:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Editor">Editor</SelectItem>
                <SelectItem value="Viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border bg-background shadow-md">
            {filteredAndSortedUsers.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                Nenhum usuário encontrado com os filtros atuais.
              </div>
            ) : (
              <>
                <div className="hidden max-h-[600px] overflow-auto md:block">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>
                          <Checkbox
                            checked={
                              selectedUsers.length === filteredAndSortedUsers.length &&
                              filteredAndSortedUsers.length > 0
                            }
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("name")}
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                          >
                            Usuário
                            {getSortIcon("name")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("email")}
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                          >
                            Email
                            {getSortIcon("email")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("role")}
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                          >
                            Perfil
                            {getSortIcon("role")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("status")}
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                          >
                            Status
                            {getSortIcon("status")}
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort("createdAt")}
                            className="-ml-3 h-8 data-[state=open]:bg-accent"
                          >
                            Cadastrado em
                            {getSortIcon("createdAt")}
                          </Button>
                        </TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedUsers.map((user) => (
                        <TableRow key={user.id} className="transition-colors hover:bg-muted/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => toggleSelectUser(user.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.name}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role) as any}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.status === "active" ? "default" : "secondary"}>
                              {user.status === "active" ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <UserDetailsDialog
                                user={user}
                                onDelete={handleDelete}
                                trigger={
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4 md:mr-2" />
                                    <span className="hidden md:inline">Ver Detalhes</span>
                                  </Button>
                                }
                              />
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/usuarios/${user.id}/edit`}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleDelete(user.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className="sticky bottom-0 z-10 bg-background shadow-inner">
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={6} className="font-medium">
                          Exibindo {filteredAndSortedUsers.length} de {users.length} usuários
                          {selectedUsers.length > 0 && ` • ${selectedUsers.length} selecionado(s)`}
                        </TableCell>
                        <TableCell className="text-center">
                          {selectedUsers.length > 0 && (
                            <Button variant="destructive" size="sm">
                              Remover Selecionados
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <div className="space-y-3 p-4 md:hidden">
                  {filteredAndSortedUsers.map((user) => (
                    <Card key={user.id} className="border border-border/70 shadow-sm">
                      <CardContent className="space-y-4 p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleSelectUser(user.id)}
                            aria-label={`Selecionar ${user.name}`}
                          />
                          <div className="flex flex-1 items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold leading-tight text-foreground">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(user.role) as any}>{user.role}</Badge>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status === "active" ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Cadastrado em</span>
                          <span>{new Date(user.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                          <UserDetailsDialog
                            user={user}
                            onDelete={handleDelete}
                            trigger={
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-center sm:w-auto"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </Button>
                            }
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="w-full justify-center sm:w-auto"
                              >
                                Ações
                                <MoreHorizontal className="ml-2 h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/usuarios/${user.id}/edit`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(user.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {selectedUsers.length > 0 && (
                    <div className="flex flex-col gap-2 rounded-md bg-primary/5 p-3 text-sm">
                      <span className="text-foreground">
                        <strong>{selectedUsers.length}</strong> usuário(s) selecionado(s)
                      </span>
                      <Button variant="destructive" size="sm" className="w-full">
                        Remover selecionados
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
