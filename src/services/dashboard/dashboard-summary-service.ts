import "server-only"

import { unstable_cache } from "next/cache"
import { createClient } from "@supabase/supabase-js"

import type {
  DashboardSummaryData,
  OuvidoriaResumo,
  TrabalhoResumo,
} from "@/features/dashboard/types"

const DASHBOARD_CACHE_TAG = "dashboardCards"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY) devem estar configuradas.",
  )
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

type SettingsRow = {
  log_ativo?: boolean | null
}

type TrabalhoVisitantesRow = {
  visitantes: number | null
}

async function fetchDashboardSummaryRaw(): Promise<DashboardSummaryData> {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const sixMonthsIso = sixMonthsAgo.toISOString().split("T")[0]

  const [ouvidoriaRes, settingsRes, postsRes, cursosRes, trabalhosRecentesRes, trabalhosVisitasRes, trabalhosTopRes] =
    await Promise.all([
      supabaseAdmin
        .from("ouvidoria")
        .select("id, assunto, status, created_at, nome_completo, tipo_manifestacao", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(6),
      supabaseAdmin
        .from("settings")
        .select("log_ativo")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin.from("posts").select("id", { count: "exact", head: true }).eq("published", true),
      supabaseAdmin.from("cursos").select("id", { count: "exact", head: true }).eq("is_ativo", true),
      supabaseAdmin
        .from("trabalhos")
        .select("id", { count: "exact", head: true })
        .gte("data_publicacao", sixMonthsIso),
      supabaseAdmin.from("trabalhos").select("visitantes"),
      supabaseAdmin
        .from("trabalhos")
        .select("id, titulo, visitantes, slug")
        .order("visitantes", { ascending: false })
        .limit(5),
    ])

  const errors = [
    ouvidoriaRes.error,
    settingsRes.error,
    postsRes.error,
    cursosRes.error,
    trabalhosRecentesRes.error,
    trabalhosVisitasRes.error,
    trabalhosTopRes.error,
  ].filter(Boolean)

  if (errors.length) {
    throw new Error(errors[0]?.message ?? "Falha ao consultar dados do dashboard.")
  }

  const ouvidoriaData: OuvidoriaResumo[] = Array.isArray(ouvidoriaRes.data)
    ? ouvidoriaRes.data
        .map((row) => {
          const safeRow = row as Record<string, unknown>
          const id = typeof safeRow.id === "string" ? safeRow.id : null
          if (!id) {
            return null
          }
          const sanitized: OuvidoriaResumo = {
            id,
            assunto: typeof safeRow.assunto === "string" ? safeRow.assunto : null,
            status: typeof safeRow.status === "string" ? safeRow.status : null,
            created_at: typeof safeRow.created_at === "string" ? safeRow.created_at : null,
            nome_completo: typeof safeRow.nome_completo === "string" ? safeRow.nome_completo : null,
            tipo_manifestacao:
              typeof safeRow.tipo_manifestacao === "string" ? safeRow.tipo_manifestacao : null,
          }
          return sanitized
        })
        .filter((item): item is OuvidoriaResumo => item !== null)
    : []

  const ouvidoriaPending = ouvidoriaData.filter((item) => (item.status ?? "Enviado") !== "Finalizado").length

  const settingsRow = settingsRes.data as SettingsRow | null
  const logValue = typeof settingsRow?.log_ativo === "boolean" ? settingsRow.log_ativo : null
  const logsEnabled = Boolean(logValue)
  const postsPublished = postsRes.count ?? 0
  const cursosAtivos = cursosRes.count ?? 0
  const trabalhosUltimoSemestre = trabalhosRecentesRes.count ?? 0
  const trabalhosVisitasData = Array.isArray(trabalhosVisitasRes.data)
    ? trabalhosVisitasRes.data.map((row) => {
        const safeRow = row as Record<string, unknown>
        const value = safeRow.visitantes
        const visitantes =
          typeof value === "number" ? value : typeof value === "string" ? Number(value) || 0 : null
        return { visitantes } satisfies TrabalhoVisitantesRow
      })
    : []
  const visitasTrabalhos = trabalhosVisitasData.reduce((acc, row) => acc + (row.visitantes ?? 0), 0)

  const trabalhosTopData: TrabalhoResumo[] = Array.isArray(trabalhosTopRes.data)
    ? trabalhosTopRes.data
        .map((row) => {
          const safeRow = row as Record<string, unknown>
          const id = typeof safeRow.id === "string" ? safeRow.id : null
          const slug = typeof safeRow.slug === "string" ? safeRow.slug : null
          if (!id || !slug) {
            return null
          }
          const sanitized: TrabalhoResumo = {
            id,
            slug,
            titulo: typeof safeRow.titulo === "string" ? safeRow.titulo : null,
            visitantes:
              typeof safeRow.visitantes === "number"
                ? safeRow.visitantes
                : typeof safeRow.visitantes === "string"
                  ? Number(safeRow.visitantes) || 0
                  : null,
          }
          return sanitized
        })
        .filter((item): item is TrabalhoResumo => item !== null)
    : []

  return {
    ouvidoriaPending,
    logsEnabled,
    postsPublished,
    cursosAtivos,
    trabalhosUltimoSemestre,
    visitasTrabalhos,
    ultimosOuvidoria: ouvidoriaData,
    topTrabalhos: trabalhosTopData,
  }
}

export const getDashboardSummaryCached = unstable_cache(
  async () => fetchDashboardSummaryRaw(),
  ["dashboard-summary"],
  { tags: [DASHBOARD_CACHE_TAG] },
)
