export type OuvidoriaResumo = {
  id: string
  assunto?: string | null
  status?: string | null
  created_at?: string | null
  nome_completo?: string | null
  tipo_manifestacao?: string | null
}

export type TrabalhoResumo = {
  id: string
  titulo?: string | null
  visitantes?: number | null
  slug: string
}

export type DashboardSummaryData = {
  ouvidoriaPending: number
  logsEnabled: boolean
  postsPublished: number
  cursosAtivos: number
  trabalhosUltimoSemestre: number
  visitasTrabalhos: number
  ultimosOuvidoria: OuvidoriaResumo[]
  topTrabalhos: TrabalhoResumo[]
}

export type DashboardSummaryResponse =
  | {
      success: true
      data: DashboardSummaryData
    }
  | {
      success: false
      message?: string
    }
