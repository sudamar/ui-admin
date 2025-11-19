"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  GraduationCap,
  Inbox,
  Newspaper,
  ServerCog,
  TriangleAlert,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { DashboardSummaryData } from "@/features/dashboard/types"

const numberFormatter = new Intl.NumberFormat("pt-BR")

const statusStyles: Record<string, string> = {
  Enviado: "bg-amber-100 text-amber-900 border-amber-200",
  "Em atendimento": "bg-sky-100 text-sky-900 border-sky-200",
  Finalizado: "bg-emerald-100 text-emerald-900 border-emerald-200",
}

const formatDate = (value: string | null | undefined) => {
  if (!value) return "Data não informada"
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

const ListSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="rounded-lg border p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-2 h-3 w-1/3" />
      </div>
    ))}
  </div>
)

type StatCardConfig = {
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  iconColor: string
  iconBg: string
  value: string
  valueClassName?: string
}

type DashboardPageClientProps = {
  summary: DashboardSummaryData | null
}

export function DashboardPageClient({ summary }: DashboardPageClientProps) {
  const loading = summary === null

  const statsRow1 = useMemo<StatCardConfig[]>(
    () => [
      {
        title: "Ouvidoria pendentes",
        description: "Chamados aguardando resposta",
        icon: Inbox,
        iconColor: "text-amber-600",
        iconBg: "bg-amber-100",
        value:
          summary !== null ? numberFormatter.format(summary.ouvidoriaPending ?? 0) : "—",
      },
      {
        title: "Logs do sistema",
        description: summary?.logsEnabled
          ? "Auditoria ativa para operações sensíveis"
          : "Auditoria desativada",
        icon: ServerCog,
        iconColor: summary?.logsEnabled ? "text-emerald-600" : "text-rose-600",
        iconBg: summary?.logsEnabled ? "bg-emerald-100" : "bg-rose-100",
        value:
          summary !== null
            ? summary.logsEnabled
              ? "Ativos"
              : "Inativos"
            : "—",
        valueClassName:
          summary !== null
            ? summary.logsEnabled
              ? "text-emerald-700"
              : "text-rose-700"
            : undefined,
      },
      {
        title: "Posts publicados",
        description: "Conteúdos ativos no site institucional",
        icon: Newspaper,
        iconColor: "text-indigo-600",
        iconBg: "bg-indigo-100",
        value:
          summary !== null ? numberFormatter.format(summary.postsPublished ?? 0) : "—",
      },
    ],
    [summary],
  )

  const statsRow2 = useMemo<StatCardConfig[]>(
    () => [
      {
        title: "Cursos ativos",
        description: "Disponíveis para matrícula",
        icon: GraduationCap,
        iconColor: "text-sky-600",
        iconBg: "bg-sky-100",
        value:
          summary !== null ? numberFormatter.format(summary.cursosAtivos ?? 0) : "—",
      },
      {
        title: "Trabalhos no semestre",
        description: "Publicados nos últimos 6 meses",
        icon: BookOpenCheck,
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-100",
        value:
          summary !== null ? numberFormatter.format(summary.trabalhosUltimoSemestre ?? 0) : "—",
      },
      {
        title: "Visitas aos trabalhos",
        description: "Somatório de acessos registrados",
        icon: BarChart3,
        iconColor: "text-purple-600",
        iconBg: "bg-purple-100",
        value:
          summary !== null ? numberFormatter.format(summary.visitasTrabalhos ?? 0) : "—",
      },
    ],
    [summary],
  )

  const renderStatsRow = (items: StatCardConfig[]) => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map(({ title, description, icon: Icon, iconBg, iconColor, value, valueClassName }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className={cn("rounded-full p-2", iconBg)}>
              <Icon className={cn("h-4 w-4", iconColor)} aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
            )}
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const ouvidoriaEntries = summary?.ultimosOuvidoria ?? []
  const trabalhosEntries = summary?.topTrabalhos ?? []

  return (
    <div className="space-y-6">
      {renderStatsRow(statsRow1)}
      {renderStatsRow(statsRow2)}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Últimos pedidos de ouvidoria</CardTitle>
              <CardDescription>
                Acompanhe rapidamente o status das últimas manifestações recebidas.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/ouvidoria"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver tudo
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ListSkeleton />
            ) : ouvidoriaEntries.length ? (
              <div className="space-y-3">
                {ouvidoriaEntries.map((entry) => {
                  const normalizedStatus = entry.status ?? "Enviado"
                  return (
                    <div
                      key={entry.id}
                      className="rounded-lg border p-4 transition hover:border-primary/40"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/dashboard/ouvidoria/${entry.id}`}
                            className="font-medium text-sm leading-tight hover:underline"
                          >
                            {entry.assunto ?? "Manifestação sem assunto"}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {entry.nome_completo ?? "Manifestante anônimo"} • {formatDate(entry.created_at)}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "shrink-0 border text-[11px]",
                            statusStyles[normalizedStatus] ?? statusStyles.Enviado,
                          )}
                        >
                          {normalizedStatus}
                        </Badge>
                      </div>
                      {entry.tipo_manifestacao ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Tipo: {entry.tipo_manifestacao}
                        </p>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <TriangleAlert className="h-4 w-4 text-amber-600" />
                Nenhum pedido de ouvidoria encontrado.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Trabalhos com mais visitas</CardTitle>
              <CardDescription>
                Destaques da biblioteca acadêmica ordenados por acessos.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/biblioteca"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ir para biblioteca
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ListSkeleton />
            ) : trabalhosEntries.length ? (
              <div className="space-y-3">
                {trabalhosEntries.map((trabalho) => (
                  <div
                    key={trabalho.id}
                    className="rounded-lg border p-4 transition hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/dashboard/biblioteca/${trabalho.slug}/edit`}
                          className="font-medium text-sm leading-tight hover:underline"
                        >
                          {trabalho.titulo ?? "Trabalho sem título"}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Código: {trabalho.slug}
                        </p>
                      </div>
                      <Badge className="shrink-0 border border-transparent bg-primary/10 text-primary">
                        {numberFormatter.format(trabalho.visitantes ?? 0)} visitas
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <TriangleAlert className="h-4 w-4 text-amber-600" />
                Nenhum trabalho encontrado para exibição.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
