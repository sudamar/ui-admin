"use client"

import { useEffect, useState, useMemo } from "react"
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
import { MoreHorizontal, Edit, Trash2, Eye, UserPlus, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { User, usersService } from "@/services/users.service"

type SortField = 'name' | 'email' | 'role' | 'status' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
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
      setUsers(users.filter(user => user.id !== id))
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
    }
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  const toggleSelectUser = (id: number) => {
    setSelectedUsers(prev =>
      prev.includes(id)
        ? prev.filter(userId => userId !== id)
        : [...prev, id]
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "Admin":
        return "default"
      case "Editor":
        return "secondary"
      default:
        return "outline"
    }
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
    let filtered = users.filter(user => {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>
        <Button asChild>
          <Link href="/users/new">
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
          {/* Filtros */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-background border rounded-lg shadow-md">
            <div className="max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>
                      <Checkbox
                        checked={selectedUsers.length === filteredAndSortedUsers.length && filteredAndSortedUsers.length > 0}
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
                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
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
                        <Badge
                          variant={user.status === "active" ? "default" : "secondary"}
                        >
                          {user.status === "active" ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[480px] bg-white">
                              <DialogHeader className="pb-4">
                                <DialogTitle className="text-xl">Detalhes do Usuário</DialogTitle>
                                <DialogDescription>
                                  Informações completas sobre{" "}
                                  <span className="font-medium text-foreground">{user.name}</span>
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-5 pt-2">
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-50">
                                  <Avatar className="h-16 w-16">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="text-lg bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-lg">{user.name}</h3>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                                <div className="grid gap-4 text-sm">
                                  <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground">Perfil:</span>
                                    <Badge variant={getRoleBadgeVariant(user.role) as any}>
                                      {user.role}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground">Status:</span>
                                    <Badge variant={user.status === "active" ? "default" : "secondary"}>
                                      {user.status === "active" ? "Ativo" : "Inativo"}
                                    </Badge>
                                  </div>
                                  <div className="flex justify-between items-center py-2">
                                    <span className="text-muted-foreground">Cadastrado em:</span>
                                    <span className="font-medium">{new Date(user.createdAt).toLocaleDateString("pt-BR")}</span>
                                  </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                  <Button asChild className="flex-1" size="lg">
                                    <Link href={`/users/${user.id}/edit`}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    size="lg"
                                    onClick={() => {
                                      handleDelete(user.id)
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remover
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
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
                                <Link href={`/users/${user.id}/edit`}>
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
                <TableFooter className="sticky bottom-0 bg-background z-10 shadow-inner">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
