"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { format, differenceInCalendarDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarClock, Clock, Inbox, Loader2, Share2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ouvidoriaService, type OuvidoriaEntry, OUVIDORIA_STATUS } from "@/services/ouvidoria/ouvidoria-service"
import { IconPhoneCalling } from "@tabler/icons-react"

const statusStyles: Record<string, string> = {
  Enviado: "bg-slate-100 text-slate-700 border-slate-200",
  "Em atendimento": "bg-amber-100 text-amber-800 border-amber-200",
  Finalizado: "bg-emerald-100 text-emerald-800 border-emerald-200",
}

export function OuvidoriaPageClient() {
  const [entries, setEntries] = useState<OuvidoriaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const chamados = await ouvidoriaService.getAll()
        setEntries(chamados)
      } catch (err) {
        console.error("Erro ao carregar ouvidoria", err)
        setError(err instanceof Error ? err.message : "Não foi possível carregar os chamados.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const matchesSearch =
        !searchTerm ||
        entry.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.mensagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.nomeCompleto ?? "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || entry.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [entries, searchTerm, statusFilter])

  const { naoRecebidos, naoAtendidos, diasMaisAntigos } = useMemo(() => {
    const naoRecebidosCount = entries.filter((entry) => entry.status === "Enviado").length
    const naoAtendidosCount = entries.filter((entry) => entry.status !== "Finalizado").length
    const validDates = entries
      .map((entry) => (entry.createdAt ? new Date(entry.createdAt) : null))
      .filter((date): date is Date => Boolean(date))
    const oldestDays =
      validDates.length > 0 ? differenceInCalendarDays(new Date(), new Date(Math.min(...validDates.map((d) => d.getTime())))) : 0
    return {
      naoRecebidos: naoRecebidosCount,
      naoAtendidos: naoAtendidosCount,
      diasMaisAntigos: oldestDays,
    }
  }, [entries])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chamados de ouvidoria</CardTitle>
          <CardDescription>Carregando chamados...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Recebendo informações do Supabase.
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chamados de ouvidoria</CardTitle>
          <CardDescription>Não foi possível carregar os chamados.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
        <CardFooter>
          <Button type="button" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold">Chamados de ouvidoria</CardTitle>
          <CardDescription>
            Temos 48 horas para tratar solicitações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Pedidos pendentes</CardTitle>
                <Inbox className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{naoRecebidos}</div>
                <p className="text-xs text-muted-foreground">Aguardam responsável</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedidos sem respostas</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{naoAtendidos}</div>
                <p className="text-xs text-muted-foreground">Ainda sem conclusão</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pedido mais antigo</CardTitle>
                <CalendarClock className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{diasMaisAntigos}</div>
                <p className="text-xs text-muted-foreground">dias desde o envio</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="search" className="text-sm font-medium">
                Buscar por assunto, mensagem ou nome
              </label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Digite para filtrar..."
                className="mt-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {OUVIDORIA_STATUS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
                disabled={!searchTerm && statusFilter === "all"}
              >
                Limpar filtros
              </Button>
            </div>
          </div>

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assunto</TableHead>
                  <TableHead>Manifestação</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead className="w-[120px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      Nenhum chamado localizado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <p className="font-semibold text-foreground">{entry.assunto}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{entry.mensagem}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{entry.tipoManifestacao}</p>
                        <p className="text-xs text-muted-foreground capitalize">{entry.identificacaoTipo}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {entry.nomeCompleto ?? (entry.identificacaoTipo === "anonimo" ? "Solicitante anônimo" : "Sem nome")}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.email ?? "Sem e-mail informado"}</p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className={`border ${statusStyles[entry.status] ?? "border-slate-200"}`}>
                            {entry.status}
                          </Badge>
                          {entry.responsavelNome ? (
                            <p className="text-xs text-muted-foreground">Recebido por {entry.responsavelNome}</p>
                          ) : entry.status !== "Enviado" ? (
                            <p className="text-xs text-muted-foreground">Recebido por responsável não identificado</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.createdAt ? format(new Date(entry.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider delayDuration={120}>
                          <div className="flex items-center justify-center gap-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button asChild size="icon" variant="outline">
                                  <Link href={`/dashboard/ouvidoria/${entry.id}?acao=responder`}>
                                    <IconPhoneCalling className="h-4 w-4" />
                                    <span className="sr-only">Responder chamado</span>
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Responder chamado</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button asChild size="icon" variant="outline">
                                  <Link href={`/dashboard/ouvidoria/${entry.id}?acao=encaminhar`}>
                                    <Share2 className="h-4 w-4" />
                                    <span className="sr-only">Encaminhar</span>
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Encaminhar para outra área</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
