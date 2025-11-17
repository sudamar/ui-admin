import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

import { imprimeLogs } from "@/lib/logger"
import { getProfileFromToken, PerfilUsuario } from "@/services/auth/auth-service"

const AUTH_COOKIE = "ui-admin-token"
const TABLE_NAME = "cursos"
const HIGHLIGHTS_TABLE = "curso_highlights"
const PROFESSORES_TABLE = "curso_professores"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY) must be configured.",
  )
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const optionalString = (schema: z.ZodString) =>
  z
    .union([schema, z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined
      }
      return value
    })

const optionalNumber = z.number().nullish().transform(v => v ?? undefined)

const optionalJson = z
  .any()
  .nullish()
  .transform(v => v ?? undefined)

const highlightSchema = z.object({
  icon: z.string().min(1, "Ícone obrigatório"),
  title: z.string().min(1, "Título obrigatório"),
  description: z.string().min(1, "Descrição obrigatória"),
  bgColor: z.union([z.string(), z.literal(""), z.null(), z.undefined()]).transform(v => v || undefined),
  iconColor: z.union([z.string(), z.literal(""), z.null(), z.undefined()]).transform(v => v || undefined),
  ordem: z.number().int().default(0),
})

const professorSchema = z.object({
  professorId: z.string().uuid("ID de professor inválido"),
  papel: z.union([z.string(), z.literal(""), z.null(), z.undefined()]).transform(v => v || undefined),
})

const cursoSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug obrigatório")
    .max(255, "Slug muito longo")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug deve conter apenas letras minúsculas, números e hífens"
    ),
  title: z
    .string()
    .trim()
    .min(3, "Título obrigatório")
    .max(255, "Título muito longo"),
  subtitle: z.string().nullish(),
  shortDescription: z.string().nullish(),
  fullDescription: optionalJson,
  image_folder: z.string().nullish(),
  category: z.string().nullish(),
  categoryLabel: z.string().nullish(),
  price: optionalNumber,
  originalPrice: optionalNumber,
  precoMatricula: optionalNumber,
  modalidade: z.string().nullish(),
  duration: z.string().nullish(),
  workload: z.string().nullish(),
  startDate: z.string().nullish(),
  maxStudents: z.string().nullish(),
  certificate: z.string().nullish(),
  monthlyPrice: z.string().nullish(),
  justificativa: optionalJson,
  objetivos: optionalJson,
  publico: optionalJson,
  investmentDetails: optionalJson,
  additionalInfo: optionalJson,
  coordenadorId: z.preprocess(
    (val) => {
      if (typeof val === 'object' && val !== null && 'id' in val && typeof val.id === 'string') {
        return val.id;
      }
      return val;
    },
    z.string().uuid("ID de coordenador inválido").nullish()
  ),
  videoUrl: z.string().nullish(),
  imageUrl: z.string().nullish(),
  highlights: z.array(highlightSchema).optional().default([]),
  professores: z.array(professorSchema).optional().default([]),
  alerta_vagas: optionalNumber,
})

imprimeLogs("[API cursos] cursoSchema criado:", typeof cursoSchema, typeof cursoSchema?.safeParse)

type CursoPayload = z.infer<typeof cursoSchema>

type CursoRow = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  short_description: string | null
  full_description: Record<string, unknown> | null
  image_folder: string | null
  category: string | null
  category_label: string | null
  price: number | null
  original_price: number | null
  preco_matricula: number | null
  modalidade: string | null
  duration: string | null
  workload: string | null
  start_date: string | null
  max_students: string | null
  certificate: string | null
  monthly_price: string | null
  justificativa: Record<string, unknown> | null
  objetivos: Record<string, unknown> | null
  publico: Record<string, unknown> | null
  investment_details: Record<string, unknown> | null
  additional_info: Record<string, unknown> | null
  coordenador_id: string | null
  created_at?: string | null
  updated_at?: string | null
  video_url: string | null
  image_url: string | null
  alerta_vagas?: number | null
}

type HighlightRow = {
  id: string
  curso_id: string
  icon: string
  title: string
  description: string
  bg_color: string | null
  icon_color: string | null
  ordem: number
  created_at?: string | null
  updated_at?: string | null
}

type ProfessorRow = {
  id: string
  curso_id: string
  professor_id: string
  papel: string | null
  created_at?: string | null
}

type CursoDto = {
  id: string
  slug: string
  title: string
  subtitle?: string
  shortDescription?: string
  fullDescription?: Record<string, unknown>
  image_folder?: string
  category?: string
  categoryLabel?: string
  price?: number
  originalPrice?: number
  precoMatricula?: number
  modalidade?: string
  duration?: string
  workload?: string
  startDate?: string
  maxStudents?: string
  certificate?: string
  monthlyPrice?: string
  justificativa?: Record<string, unknown>
  objetivos?: Record<string, unknown>
  publico?: Record<string, unknown>
  investmentDetails?: Record<string, unknown>
  additionalInfo?: Record<string, unknown>
  coordenadorId?: string
  createdAt?: string
  updatedAt?: string
  videoUrl?: string
  imageUrl?: string
  highlights?: Array<{
    id: string
    icon: string
    title: string
    description: string
    bgColor?: string
    iconColor?: string
    ordem: number
  }>
  professores?: Array<{
    id: string
    professorId: string
    papel?: string
  }>
  alertaVagas?: number
}

function mapCurso(row: CursoRow): CursoDto {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    shortDescription: row.short_description ?? undefined,
    fullDescription: row.full_description ?? undefined,
    image_folder: row.image_folder ?? undefined,
    category: row.category ?? undefined,
    categoryLabel: row.category_label ?? undefined,
    price: row.price ?? undefined,
    originalPrice: row.original_price ?? undefined,
    precoMatricula: row.preco_matricula ?? undefined,
    modalidade: row.modalidade ?? undefined,
    duration: row.duration ?? undefined,
    workload: row.workload ?? undefined,
    startDate: row.start_date ?? undefined,
    maxStudents: row.max_students ?? undefined,
    certificate: row.certificate ?? undefined,
    monthlyPrice: row.monthly_price ?? undefined,
    justificativa: row.justificativa ?? undefined,
    objetivos: row.objetivos ?? undefined,
    publico: row.publico ?? undefined,
    investmentDetails: row.investment_details ?? undefined,
    additionalInfo: row.additional_info ?? undefined,
    coordenadorId: row.coordenador_id ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    videoUrl: row.video_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    alertaVagas: row.alerta_vagas ?? undefined,
  }
}

function mapHighlight(row: HighlightRow) {
  return {
    id: row.id,
    icon: row.icon,
    title: row.title,
    description: row.description,
    bgColor: row.bg_color ?? undefined,
    iconColor: row.icon_color ?? undefined,
    ordem: row.ordem,
  }
}

function mapProfessor(row: ProfessorRow) {
  return {
    id: row.id,
    professorId: row.professor_id,
    papel: row.papel ?? undefined,
  }
}

async function ensureAuthorized() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: "Não autenticado." },
        { status: 401 },
      ),
    }
  }

  const currentUser = await getProfileFromToken(token)

  if (
    !currentUser ||
    (currentUser.perfil !== PerfilUsuario.Admin &&
      currentUser.perfil !== PerfilUsuario.Secretaria)
  ) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Apenas administradores e secretaria podem gerenciar cursos.",
        },
        { status: 403 },
      ),
    }
  }

  return { authorized: true as const, response: null }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const slug = searchParams.get("slug")

  imprimeLogs("[GET /api/cursos] Parâmetros:", { id, slug })

  let query = supabaseAdmin
    .from(TABLE_NAME)
    .select("*")
    .order("title", { ascending: true })

  if (id) {
    imprimeLogs("[GET /api/cursos] Buscando por ID:", id)
    query = query.eq("id", id).limit(1)
  } else if (slug) {
    imprimeLogs("[GET /api/cursos] Buscando por slug:", slug)
    query = query.eq("slug", slug).limit(1)
  } else {
    imprimeLogs("[GET /api/cursos] Buscando todos os cursos")
  }

  imprimeLogs("[GET /api/cursos] Executando query principal...")
  const { data, error } = await query

  if (error) {
    console.error("[GET /api/cursos] Erro na query principal:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message ?? "Não foi possível carregar os cursos.",
      },
      { status: 500 },
    )
  }

  imprimeLogs("[GET /api/cursos] Query principal retornou", data?.length ?? 0, "cursos")

  const cursos = (data ?? []).map(mapCurso)

  for (const curso of cursos) {
    imprimeLogs(`[GET /api/cursos] Carregando dados relacionados do curso: ${curso.id} (${curso.title})`)

    const [highlightsRes, professoresRes] = await Promise.all([
      supabaseAdmin
        .from(HIGHLIGHTS_TABLE)
        .select("*")
        .eq("curso_id", curso.id)
        .order("ordem", { ascending: true }),
      supabaseAdmin
        .from(PROFESSORES_TABLE)
        .select("*")
        .eq("curso_id", curso.id),
    ])

    if (highlightsRes.error) {
      console.error(`[GET /api/cursos] Erro ao buscar highlights do curso ${curso.id}:`, highlightsRes.error)
    } else {
      imprimeLogs(`[GET /api/cursos] Curso ${curso.id}: ${highlightsRes.data?.length ?? 0} highlights`)
    }

    if (professoresRes.error) {
      console.error(`[GET /api/cursos] Erro ao buscar professores do curso ${curso.id}:`, professoresRes.error)
    } else {
      imprimeLogs(`[GET /api/cursos] Curso ${curso.id}: ${professoresRes.data?.length ?? 0} professores`)
    }

    curso.highlights = (highlightsRes.data ?? []).map(mapHighlight)
    curso.professores = (professoresRes.data ?? []).map(mapProfessor)
  }

  if (id || slug) {
    const curso = cursos[0]
    if (!curso) {
      return NextResponse.json(
        { success: false, message: "Curso não encontrado." },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, curso })
  }

  return NextResponse.json({ success: true, cursos })
}

export async function POST(request: Request) {
  imprimeLogs("[POST /api/cursos] Iniciando criação de curso")

  const { authorized, response } = await ensureAuthorized()
  if (!authorized) {
    imprimeLogs("[POST /api/cursos] Usuário não autorizado")
    return response
  }

  const payload = await request.json().catch(() => null)
  imprimeLogs("[POST /api/cursos] Payload recebido:", JSON.stringify(payload, null, 2))

  const parsed = cursoSchema?.safeParse(payload) 

  if (!parsed.success) {
    console.error("[POST /api/cursos] Validação falhou:", parsed.error.issues)

    // Criar mensagem amigável com os erros
    const errorMessages = parsed.error.issues.map(issue => {
      const fieldName = issue.path.join('.')
      return `${fieldName}: ${issue.message}`
    }).join('; ')

    return NextResponse.json(
      {
        success: false,
        message: errorMessages || "Dados inválidos.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    )
  }

  imprimeLogs("[POST /api/cursos] Validação OK, preparando insert")

  const insertPayload = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle ?? null,
    short_description: parsed.data.shortDescription ?? null,
    full_description: parsed.data.fullDescription ?? null,
    image_folder: parsed.data.image_folder ?? null,
    category: parsed.data.category ?? null,
    category_label: parsed.data.categoryLabel ?? null,
    price: parsed.data.price ?? null,
    original_price: parsed.data.originalPrice ?? null,
    preco_matricula: parsed.data.precoMatricula ?? null,
    modalidade: parsed.data.modalidade ?? null,
    duration: parsed.data.duration ?? null,
    workload: parsed.data.workload ?? null,
    start_date: parsed.data.startDate ?? null,
    max_students: parsed.data.maxStudents ?? null,
    certificate: parsed.data.certificate ?? null,
    monthly_price: parsed.data.monthlyPrice ?? null,
    justificativa: parsed.data.justificativa ?? null,
    objetivos: parsed.data.objetivos ?? null,
    publico: parsed.data.publico ?? null,
    investment_details: parsed.data.investmentDetails ?? null,
    additional_info: parsed.data.additionalInfo ?? null,
    coordenador_id: parsed.data.coordenadorId ?? null,
    video_url: parsed.data.videoUrl ?? null,
    image_url: parsed.data.imageUrl ?? null,
    alerta_vagas: parsed.data.alerta_vagas ?? null,
  }

  imprimeLogs("[POST /api/cursos] Inserindo curso na tabela principal")
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .insert(insertPayload)
    .select("*")
    .maybeSingle()

  if (error || !data) {
    console.error("[POST /api/cursos] Erro ao inserir curso:", error)
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ??
          "Não foi possível cadastrar o curso. Tente novamente.",
      },
      { status: 500 },
    )
  }

  imprimeLogs("[POST /api/cursos] Curso criado com ID:", data.id)
  const curso = mapCurso(data)

  if (parsed.data.highlights && parsed.data.highlights.length > 0) {
    imprimeLogs(`[POST /api/cursos] Inserindo ${parsed.data.highlights.length} highlights`)
    const highlightsPayload = parsed.data.highlights.map((h, index) => ({
      curso_id: curso.id,
      icon: h.icon,
      title: h.title,
      description: h.description,
      bg_color: h.bgColor ?? null,
      icon_color: h.iconColor ?? null,
      ordem: h.ordem ?? index,
    }))

    const { data: highlightsData, error: highlightsError } = await supabaseAdmin
      .from(HIGHLIGHTS_TABLE)
      .insert(highlightsPayload)
      .select("*")

    if (highlightsError) {
      console.error("[POST /api/cursos] Erro ao inserir highlights:", highlightsError)
    } else {
      imprimeLogs(`[POST /api/cursos] ${highlightsData?.length ?? 0} highlights inseridos`)
    }

    curso.highlights = (highlightsData ?? []).map(mapHighlight)
  }

  if (parsed.data.professores && parsed.data.professores.length > 0) {
    imprimeLogs(`[POST /api/cursos] Inserindo ${parsed.data.professores.length} professores`)
    const professoresPayload = parsed.data.professores.map((p) => ({
      curso_id: curso.id,
      professor_id: p.professorId,
      papel: p.papel ?? null,
    }))

    const { data: professoresData, error: professoresError } = await supabaseAdmin
      .from(PROFESSORES_TABLE)
      .insert(professoresPayload)
      .select("*")

    if (professoresError) {
      console.error("[POST /api/cursos] Erro ao inserir professores:", professoresError)
    } else {
      imprimeLogs(`[POST /api/cursos] ${professoresData?.length ?? 0} professores inseridos`)
    }

    curso.professores = (professoresData ?? []).map(mapProfessor)
  }

  imprimeLogs("[POST /api/cursos] Curso criado com sucesso:", curso.id)
  return NextResponse.json({
    success: true,
    curso,
  })
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  imprimeLogs("[PATCH /api/cursos] Iniciando atualização do curso:", id)

  if (!id) {
    console.error("[PATCH /api/cursos] ID não fornecido")
    return NextResponse.json(
      {
        success: false,
        message: "Informe o ID do curso que deseja atualizar.",
      },
      { status: 400 },
    )
  }

  const { authorized, response } = await ensureAuthorized()
  if (!authorized) {
    imprimeLogs("[PATCH /api/cursos] Usuário não autorizado")
    return response
  }

  const payload = await request.json().catch(() => null)
  imprimeLogs("[PATCH /api/cursos] ========== PAYLOAD COMPLETO ==========")
  imprimeLogs("[PATCH /api/cursos] Payload recebido para curso", id, ":")
  imprimeLogs(JSON.stringify(payload, null, 2))
  imprimeLogs("[PATCH /api/cursos] =======================================")

  if (!payload) {
    console.error("[PATCH /api/cursos] Payload é null ou inválido")
    return NextResponse.json(
      {
        success: false,
        message: "Corpo da requisição inválido.",
      },
      { status: 400 },
    )
  }

  imprimeLogs("[PATCH] Validando payload com Zod...")

  let parsed
  try {
    parsed = cursoSchema.safeParse(payload)
    imprimeLogs("[PATCH] safeParse executado com sucesso:", parsed.success)
  } catch (error) {
    console.error("[PATCH] ❌ Erro ao executar safeParse:")
    console.error("[PATCH] Error:", error)
    console.error("[PATCH] Error message:", error instanceof Error ? error.message : String(error))
    console.error("[PATCH] Error stack:", error instanceof Error ? error.stack : "N/A")
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao validar dados: " + (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    )
  }

  if (!parsed || !parsed.success) {
    console.error("[PATCH /api/cursos] Validação falhou:", parsed?.error?.issues)

    // Criar mensagem amigável com os erros
    const errorMessages = parsed.error.issues.map(issue => {
      const fieldName = issue.path.join('.')
      return `${fieldName}: ${issue.message}`
    }).join('; ')

    return NextResponse.json(
      {
        success: false,
        message: errorMessages || "Dados inválidos.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    )
  }

  imprimeLogs("[PATCH /api/cursos] Validação OK, preparando update")

  const updatePayload = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    subtitle: parsed.data.subtitle ?? null,
    short_description: parsed.data.shortDescription ?? null,
    full_description: parsed.data.fullDescription ?? null,
    image_folder: parsed.data.image_folder ?? null,
    category: parsed.data.category ?? null,
    category_label: parsed.data.categoryLabel ?? null,
    price: parsed.data.price ?? null,
    original_price: parsed.data.originalPrice ?? null,
    preco_matricula: parsed.data.precoMatricula ?? null,
    modalidade: parsed.data.modalidade ?? null,
    duration: parsed.data.duration ?? null,
    workload: parsed.data.workload ?? null,
    start_date: parsed.data.startDate ?? null,
    max_students: parsed.data.maxStudents ?? null,
    certificate: parsed.data.certificate ?? null,
    monthly_price: parsed.data.monthlyPrice ?? null,
    justificativa: parsed.data.justificativa ?? null,
    objetivos: parsed.data.objetivos ?? null,
    publico: parsed.data.publico ?? null,
    investment_details: parsed.data.investmentDetails ?? null,
    additional_info: parsed.data.additionalInfo ?? null,
    coordenador_id: parsed.data.coordenadorId ?? null,
    video_url: parsed.data.videoUrl ?? null,
    image_url: parsed.data.imageUrl ?? null,
    alerta_vagas: parsed.data.alerta_vagas ?? null,
  }

  imprimeLogs("[PATCH /api/cursos] Atualizando curso na tabela principal")
  imprimeLogs("[PATCH /api/cursos] UPDATE payload:", JSON.stringify(updatePayload, null, 2))
  imprimeLogs(`[PATCH /api/cursos] SQL: UPDATE ${TABLE_NAME} SET ... WHERE id = '${id}'`)

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (error) {
    console.error("[PATCH /api/cursos] Erro ao atualizar curso:", error)
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ??
          "Não foi possível atualizar os dados do curso informado.",
      },
      { status: 500 },
    )
  }

  if (!data) {
    console.error("[PATCH /api/cursos] Curso não encontrado:", id)
    return NextResponse.json(
      { success: false, message: "Curso não encontrado." },
      { status: 404 },
    )
  }

  imprimeLogs("[PATCH /api/cursos] ✓ UPDATE executado com sucesso na tabela cursos")
  imprimeLogs("[PATCH /api/cursos] Curso atualizado, processando relacionamentos")
  const curso = mapCurso(data)

  imprimeLogs("[PATCH /api/cursos] Removendo highlights antigos do curso", id)
  const { error: deleteHighlightsError } = await supabaseAdmin.from(HIGHLIGHTS_TABLE).delete().eq("curso_id", id)

  if (deleteHighlightsError) {
    console.error("[PATCH /api/cursos] Erro ao deletar highlights:", deleteHighlightsError)
  }

  if (parsed.data.highlights && parsed.data.highlights.length > 0) {
    imprimeLogs(`[PATCH /api/cursos] Inserindo ${parsed.data.highlights.length} novos highlights`)
    const highlightsPayload = parsed.data.highlights.map((h, index) => ({
      curso_id: id,
      icon: h.icon,
      title: h.title,
      description: h.description,
      bg_color: h.bgColor ?? null,
      icon_color: h.iconColor ?? null,
      ordem: h.ordem ?? index,
    }))

    const { data: highlightsData, error: highlightsError } = await supabaseAdmin
      .from(HIGHLIGHTS_TABLE)
      .insert(highlightsPayload)
      .select("*")

    if (highlightsError) {
      console.error("[PATCH /api/cursos] Erro ao inserir highlights:", highlightsError)
    } else {
      imprimeLogs(`[PATCH /api/cursos] ${highlightsData?.length ?? 0} highlights inseridos`)
    }

    curso.highlights = (highlightsData ?? []).map(mapHighlight)
  }

  imprimeLogs("[PATCH /api/cursos] Removendo professores antigos do curso", id)
  const { error: deleteProfessoresError } = await supabaseAdmin.from(PROFESSORES_TABLE).delete().eq("curso_id", id)

  if (deleteProfessoresError) {
    console.error("[PATCH /api/cursos] Erro ao deletar professores:", deleteProfessoresError)
  }

  if (parsed.data.professores && parsed.data.professores.length > 0) {
    imprimeLogs(`[PATCH /api/cursos] Inserindo ${parsed.data.professores.length} novos professores`)
    const professoresPayload = parsed.data.professores.map((p) => ({
      curso_id: id,
      professor_id: p.professorId,
      papel: p.papel ?? null,
    }))

    const { data: professoresData, error: professoresError } = await supabaseAdmin
      .from(PROFESSORES_TABLE)
      .insert(professoresPayload)
      .select("*")

    if (professoresError) {
      console.error("[POST /api/cursos] Erro ao inserir professores:", professoresError)
    } else {
      imprimeLogs(`[POST /api/cursos] ${professoresData?.length ?? 0} professores inseridos`)
    }

    curso.professores = (professoresData ?? []).map(mapProfessor)
  }

  imprimeLogs("[PATCH /api/cursos] Curso atualizado com sucesso:", id)

  const finalResponse = {
    success: true,
    curso,
  }

  imprimeLogs("[PATCH /api/cursos] ========== RESPOSTA FINAL ==========")
  imprimeLogs("[PATCH /api/cursos] Response que será enviada:")
  imprimeLogs(JSON.stringify(finalResponse, null, 2))
  imprimeLogs("[PATCH /api/cursos] ====================================")

  return NextResponse.json(finalResponse)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  imprimeLogs("[DELETE /api/cursos] Iniciando remoção do curso:", id)

  if (!id) {
    console.error("[DELETE /api/cursos] ID não fornecido")
    return NextResponse.json(
      { success: false, message: "Informe o ID do curso a ser removido." },
      { status: 400 },
    )
  }

  const { authorized, response } = await ensureAuthorized()
  if (!authorized) {
    imprimeLogs("[DELETE /api/cursos] Usuário não autorizado")
    return response
  }

  imprimeLogs("[DELETE /api/cursos] Removendo curso da tabela principal (cascade para relacionamentos)")
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) {
    console.error("[DELETE /api/cursos] Erro ao remover curso:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message ?? "Não foi possível remover o curso.",
      },
      { status: 500 },
    )
  }

  if (!data) {
    console.error("[DELETE /api/cursos] Curso não encontrado:", id)
    return NextResponse.json(
      { success: false, message: "Curso não encontrado." },
      { status: 404 },
    )
  }

  imprimeLogs("[DELETE /api/cursos] Curso removido com sucesso:", id)
  return NextResponse.json({ success: true })
}
