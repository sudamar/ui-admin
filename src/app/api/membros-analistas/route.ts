import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

import { getProfileFromToken, PerfilUsuario } from "@/services/auth/auth-service"

const AUTH_COOKIE = "ui-admin-token"
const TABLE_NAME = "membros_analistas"

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

const optionalString = (schema: z.ZodType<string>) =>
  z
    .union([schema, z.literal(""), z.null(), z.undefined()])
    .transform((value) => {
      if (value === "" || value === null || value === undefined) {
        return undefined
      }
      return value
    })

const membroAnalistaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo do membro.")
    .max(255, "Nome muito longo."),
  tipo: z
    .string()
    .trim()
    .min(2, "Informe o tipo do membro.")
    .max(100, "Tipo muito longo."),
  atendimento: z
    .string()
    .trim()
    .min(2, "Informe o atendimento do membro.")
    .max(50, "Atendimento muito longo."),
  cidade: optionalString(z.string().trim().max(255, "Cidade muito longa.")),
  estado: optionalString(
    z
      .string()
      .trim()
      .length(2, "Informe a sigla do estado.")
      .transform((value) => value.toUpperCase()),
  ),
  descricao: optionalString(z.string().trim()),
  telefone: optionalString(
    z.string().trim().min(5, "Informe um telefone válido."),
  ),
  email: optionalString(
    z.string().trim().email("Informe um e-mail válido."),
  ),
  foto: optionalString(z.string()),
  linkMembro: optionalString(
    z.string().trim().url("Informe uma URL válida."),
  ),
})

type MembroAnalistaPayload = z.infer<typeof membroAnalistaSchema>

type MembroAnalistaRow = {
  id: string
  nome: string
  tipo: string
  atendimento: string
  cidade: string | null
  estado: string | null
  descricao: string | null
  telefone: string | null
  email: string | null
  foto: string | null
  link_membro: string | null
  created_at?: string | null
  updated_at?: string | null
}

type MembroAnalistaDto = {
  id: string
  nome: string
  tipo: string
  atendimento: string
  cidade?: string
  estado?: string
  descricao?: string
  telefone?: string
  email?: string
  foto?: string
  linkMembro?: string
  createdAt?: string
  updatedAt?: string
}

function mapMembroAnalista(row: MembroAnalistaRow): MembroAnalistaDto {
  return {
    id: row.id,
    nome: row.nome,
    tipo: row.tipo,
    atendimento: row.atendimento,
    cidade: row.cidade ?? undefined,
    estado: row.estado ?? undefined,
    descricao: row.descricao ?? undefined,
    telefone: row.telefone ?? undefined,
    email: row.email ?? undefined,
    foto: row.foto ?? undefined,
    linkMembro:
      row.link_membro && row.link_membro.toLowerCase() !== "null"
        ? row.link_membro
        : undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
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
          message: "Apenas administradores podem gerenciar membros analistas.",
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

  let query = supabaseAdmin
    .from(TABLE_NAME)
    .select(
      "id,nome,tipo,atendimento,cidade,estado,descricao,telefone,email,foto,link_membro,created_at,updated_at",
    )
    .order("nome", { ascending: true })

  if (id) {
    query = query.eq("id", id).limit(1)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message ?? "Não foi possível carregar os membros analistas.",
      },
      { status: 500 },
    )
  }

  const membros = (data ?? []).map(mapMembroAnalista)

  if (id) {
    const membro = membros[0]
    if (!membro) {
      return NextResponse.json(
        { success: false, message: "Membro analista não encontrado." },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, membro })
  }

  return NextResponse.json({ success: true, membros })
}

export async function POST(request: Request) {
  const { authorized, response } = await ensureAuthorized()
  if (!authorized) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const parsed = membroAnalistaSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Dados inválidos.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    )
  }

  const insertPayload: Record<string, unknown> = {
    nome: parsed.data.nome,
    tipo: parsed.data.tipo,
    atendimento: parsed.data.atendimento,
    cidade: parsed.data.cidade ?? null,
    estado: parsed.data.estado ?? null,
    descricao: parsed.data.descricao ?? null,
    telefone: parsed.data.telefone ?? null,
    email: parsed.data.email ?? null,
    foto: parsed.data.foto ?? null,
    link_membro: parsed.data.linkMembro ?? null,
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .insert(insertPayload)
    .select(
      "id,nome,tipo,atendimento,cidade,estado,descricao,telefone,email,foto,link_membro,created_at,updated_at",
    )
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ??
          "Não foi possível cadastrar o membro analista. Tente novamente.",
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    membro: mapMembroAnalista(data),
  })
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Informe o ID do membro analista que deseja atualizar.",
      },
      { status: 400 },
    )
  }

  const { authorized, response } = await ensureAuthorized()
  if (!authorized) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const parsed = membroAnalistaSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Dados inválidos.",
        issues: parsed.error.issues,
      },
      { status: 400 },
    )
  }

  const updatePayload: Record<string, unknown> = {
    nome: parsed.data.nome,
    tipo: parsed.data.tipo,
    atendimento: parsed.data.atendimento,
    cidade: parsed.data.cidade ?? null,
    estado: parsed.data.estado ?? null,
    descricao: parsed.data.descricao ?? null,
    telefone: parsed.data.telefone ?? null,
    email: parsed.data.email ?? null,
    foto: parsed.data.foto ?? null,
    link_membro: parsed.data.linkMembro ?? null,
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id,nome,tipo,atendimento,cidade,estado,descricao,telefone,email,foto,link_membro,created_at,updated_at",
    )
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ??
          "Não foi possível atualizar os dados do membro analista informado.",
      },
      { status: 500 },
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, message: "Membro analista não encontrado." },
      { status: 404 },
    )
  }

  return NextResponse.json({
    success: true,
    membro: mapMembroAnalista(data),
  })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Informe o ID do membro analista a ser removido.",
      },
      { status: 400 },
    )
  }

  const { authorized, response } = await ensureAuthorized()
  if (!authorized) {
    return response
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message ?? "Não foi possível remover o membro analista.",
      },
      { status: 500 },
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, message: "Membro analista não encontrado." },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true })
}
