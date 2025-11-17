import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient, type PostgrestResponse, type PostgrestSingleResponse } from "@supabase/supabase-js"
import { z } from "zod"

import { getProfileFromToken, PerfilUsuario } from "@/services/auth/auth-service"

const AUTH_COOKIE = "ui-admin-token"
const TABLE_NAME = "ouvidoria"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY) must be configured.")
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const statusSchema = z.enum(["Enviado", "Em atendimento", "Finalizado"])

const updateSchema = z
  .object({
    status: statusSchema.optional(),
    idUsuarioRecebimento: z.string().uuid("ID de usuário inválido.").optional(),
    reply: z.string().optional(),
  })
  .refine((data) => data.status || data.idUsuarioRecebimento || typeof data.reply === "string", {
    message: "Informe ao menos um campo para atualizar.",
  })

const ouvidoriaRowSchema = z.object({
  id: z.string(),
  identificacao_tipo: z.string(),
  nome_completo: z.string().nullable(),
  email: z.string().nullable(),
  telefone: z.string().nullable(),
  vinculo: z.string().nullable(),
  tipo_manifestacao: z.string(),
  assunto: z.string(),
  mensagem: z.string(),
  created_at: z.string().nullable(),
  status: statusSchema.nullable(),
  id_usuario_recebimento: z.string().nullable(),
  reply: z.string().nullable(),
})

type OuvidoriaRow = z.infer<typeof ouvidoriaRowSchema>
type OuvidoriaStatus = z.infer<typeof statusSchema>

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isValidUuid = (value: string | null | undefined): value is string => typeof value === "string" && UUID_REGEX.test(value)

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, "")

const formatDateTime = (value: string | null) => {
  if (!value) return "data não informada"
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date(value))
  } catch {
    return value
  }
}

async function sendReplyEmail(entry: OuvidoriaRow, replyHtml: string) {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "ouvidoria@fafih.edu.br"

  if (!apiKey || !entry.email) {
    if (!apiKey) {
      console.warn("[API][Ouvidoria] RESEND_API_KEY não configurada. E-mail não enviado.")
    }
    return
  }

  const openedAt = formatDateTime(entry.created_at ?? null)
  const intro = `Sobre sua solicitação aberta em ${openedAt}, nossa instituição diz:`
  const html = `<p>${intro}</p>${replyHtml}`
  const text = `${intro}\n\n${stripHtml(replyHtml)}`

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: entry.email,
      subject: "Resposta à sua solicitação - Ouvidoria FAFIH",
      html,
      text,
    }),
  })
}

const normalizeStatus = (value: string | null): OuvidoriaStatus => {
  const parsed = statusSchema.safeParse(value)
  if (parsed.success) {
    return parsed.data
  }
  return "Enviado"
}

const mapRow = (row: OuvidoriaRow, responsavelNome?: string | null) => ({
  id: row.id,
  identificacaoTipo: row.identificacao_tipo,
  nomeCompleto: row.nome_completo ?? null,
  email: row.email ?? null,
  telefone: row.telefone ?? null,
  vinculo: row.vinculo ?? null,
  tipoManifestacao: row.tipo_manifestacao,
  assunto: row.assunto,
  mensagem: row.mensagem,
  createdAt: row.created_at ?? null,
  status: normalizeStatus(row.status),
  responsavelId: row.id_usuario_recebimento ?? null,
  responsavelNome: responsavelNome ?? null,
  reply: row.reply ?? null,
})

const parseRowSafe = (row: unknown): OuvidoriaRow => {
  const parsed = ouvidoriaRowSchema.safeParse(row)
  if (!parsed.success) {
    throw new Error("Registro de ouvidoria inválido.")
  }
  return parsed.data
}

async function ensureAuthorized() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value ?? null

  if (!token) {
    return {
      allowed: false,
      response: NextResponse.json({ success: false, message: "Não autenticado." }, { status: 401 }),
    }
  }

  const profile = await getProfileFromToken(token)
  if (!profile || ![PerfilUsuario.Admin, PerfilUsuario.Secretaria].includes(profile.perfil)) {
    return {
      allowed: false,
      response: NextResponse.json({ success: false, message: "Acesso negado." }, { status: 403 }),
    }
  }

  return { allowed: true, profile }
}

async function loadResponsavelMap(rows: OuvidoriaRow[]) {
  const ids = Array.from(
    new Set(rows.map((row) => row.id_usuario_recebimento).filter((value): value is string => isValidUuid(value))),
  )
  if (!ids.length) {
    return new Map<string, string>()
  }

  const { data, error } = await supabaseAdmin
    .from("usuarios_detalhes")
    .select("id, display_name")
    .in("id", ids)

  if (error) {
    console.warn("[API][Ouvidoria] Não foi possível carregar responsáveis:", error.message)
    return new Map<string, string>()
  }

  const map = new Map<string, string>()
  data?.forEach((item) => {
    if (item && typeof item.id === "string") {
      map.set(item.id, (item.display_name as string | null) ?? "Responsável")
    }
  })

  return map
}

export async function GET(request: Request) {
  const auth = await ensureAuthorized()
  if (!auth.allowed) {
    return auth.response
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  let query = supabaseAdmin.from<OuvidoriaRow>(TABLE_NAME).select("*").order("created_at", { ascending: false })
  if (id) {
    query = query.eq("id", id).limit(1)
  }

  const { data, error }: PostgrestResponse<OuvidoriaRow> = await query
  if (error) {
    return NextResponse.json({ success: false, message: error.message ?? "Erro ao buscar chamados." }, { status: 500 })
  }

  try {
    const parsedRows = (data ?? []).map((row) => parseRowSafe(row))
    const responsaveis = await loadResponsavelMap(parsedRows)

    if (id) {
      const chamado = parsedRows[0]
      if (!chamado) {
        return NextResponse.json({ success: false, message: "Chamado não encontrado." }, { status: 404 })
      }
      const responsavelNome =
        chamado.id_usuario_recebimento && responsaveis.size > 0
          ? responsaveis.get(chamado.id_usuario_recebimento) ?? null
          : null
      return NextResponse.json({ success: true, chamado: mapRow(chamado, responsavelNome) })
    }

    const chamados = parsedRows.map((row) =>
      mapRow(
        row,
        row.id_usuario_recebimento && responsaveis.size > 0 ? responsaveis.get(row.id_usuario_recebimento) ?? null : null,
      ),
    )
    return NextResponse.json({ success: true, chamados })
  } catch (parseError) {
    console.error("[API][Ouvidoria] Erro ao normalizar dados:", parseError)
    return NextResponse.json(
      { success: false, message: "Não foi possível interpretar os registros da ouvidoria." },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  const auth = await ensureAuthorized()
  if (!auth.allowed) {
    return auth.response
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ success: false, message: "Informe o ID do chamado." }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as unknown
  if (!body) {
    return NextResponse.json({ success: false, message: "Payload inválido." }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, message: parsed.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 },
    )
  }

  const updatePayload: Record<string, unknown> = {}
  if (parsed.data.status) {
    updatePayload.status = parsed.data.status
  }
  if (parsed.data.idUsuarioRecebimento) {
    updatePayload.id_usuario_recebimento = parsed.data.idUsuarioRecebimento
  }
  if (typeof parsed.data.reply === "string") {
    updatePayload.reply = parsed.data.reply
  }

  const { data, error }: PostgrestSingleResponse<OuvidoriaRow> = await supabaseAdmin
    .from<OuvidoriaRow>(TABLE_NAME)
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .maybeSingle()
  if (error || !data) {
    return NextResponse.json(
      { success: false, message: error?.message ?? "Não foi possível atualizar o chamado." },
      { status: 500 },
    )
  }

  try {
    const parsedRow = parseRowSafe(data)
    const responsaveis = await loadResponsavelMap([parsedRow])
    const responsavelNome =
      parsedRow.id_usuario_recebimento && responsaveis.size > 0
        ? responsaveis.get(parsedRow.id_usuario_recebimento) ?? null
        : null

    if (
      typeof parsed.data.reply === "string" &&
      parsed.data.reply.trim().length > 0 &&
      parsedRow.identificacao_tipo === "identificado" &&
      parsedRow.email
    ) {
      try {
        await sendReplyEmail(parsedRow, parsed.data.reply)
      } catch (emailError) {
        console.error("[API][Ouvidoria] Falha ao enviar e-mail:", emailError)
      }
    }

    return NextResponse.json({ success: true, chamado: mapRow(parsedRow, responsavelNome) })
  } catch (parseError) {
    console.error("[API][Ouvidoria] Erro ao interpretar registro atualizado:", parseError)
    return NextResponse.json(
      { success: false, message: "Chamado atualizado, mas não foi possível ler o resultado." },
      { status: 500 },
    )
  }
}
