import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

import { getProfileFromToken, PerfilUsuario } from "@/services/auth/auth-service"

const AUTH_COOKIE = "ui-admin-token"
const TABLE_NAME = "professores"

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

const professorSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo do professor.")
    .max(255, "Nome muito longo."),
  titulacao: optionalString(
    z.string().trim().max(255, "Titulação muito longa."),
  ),
  descricao: optionalString(z.string().trim()),
  foto: optionalString(z.string()),
  email: optionalString(
    z.string().trim().email("Informe um e-mail válido."),
  ),
  telefone: optionalString(
    z.string().trim().min(5, "Informe um telefone válido."),
  ),
  linkProfessor: optionalString(
    z.string().trim().url("Informe uma URL válida."),
  ),
})

type ProfessorPayload = z.infer<typeof professorSchema>

type ProfessorRow = {
  id: string
  nome: string
  titulacao: string | null
  descricao: string | null
  foto: string | null
  email: string | null
  telefone: string | null
  link_professor: string | null
  created_at?: string | null
  updated_at?: string | null
}

type ProfessorDto = {
  id: string
  nome: string
  titulacao?: string
  descricao?: string
  foto?: string
  email?: string
  telefone?: string
  linkProfessor?: string
  createdAt?: string
  updatedAt?: string
}

function mapProfessor(row: ProfessorRow): ProfessorDto {
  return {
    id: row.id,
    nome: row.nome,
    titulacao: row.titulacao ?? undefined,
    descricao: row.descricao ?? undefined,
    foto: row.foto ?? undefined,
    email: row.email ?? undefined,
    telefone: row.telefone ?? undefined,
    linkProfessor:
      row.link_professor && row.link_professor.toLowerCase() !== "null"
        ? row.link_professor
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
          message: "Apenas administradores podem gerenciar professores.",
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
      "id,nome,titulacao,descricao,foto,email,telefone,link_professor,created_at,updated_at",
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
        message: error.message ?? "Não foi possível carregar os professores.",
      },
      { status: 500 },
    )
  }

  const professores = (data ?? []).map(mapProfessor)

  if (id) {
    const professor = professores[0]
    if (!professor) {
      return NextResponse.json(
        { success: false, message: "Professor não encontrado." },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, professor })
  }

  return NextResponse.json({ success: true, professores })
}

export async function POST(request: Request) {
  const { authorized, response } = await ensureAuthorized()
  if (!authorized) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const parsed = professorSchema.safeParse(payload)

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

  const insertPayload = {
    nome: parsed.data.nome,
    titulacao: parsed.data.titulacao ?? null,
    descricao: parsed.data.descricao ?? null,
    foto: parsed.data.foto ?? null,
    email: parsed.data.email ?? null,
    telefone: parsed.data.telefone ?? null,
    link_professor: parsed.data.linkProfessor ?? null,
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .insert(insertPayload)
    .select(
      "id,nome,titulacao,descricao,foto,email,telefone,link_professor,created_at,updated_at",
    )
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ??
          "Não foi possível cadastrar o professor. Tente novamente.",
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    professor: mapProfessor(data),
  })
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Informe o ID do professor que deseja atualizar.",
      },
      { status: 400 },
    )
  }

  const { authorized, response } = await ensureAuthorized()
  if (!authorized) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const parsed = professorSchema.safeParse(payload)

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

  const updatePayload = {
    nome: parsed.data.nome,
    titulacao: parsed.data.titulacao ?? null,
    descricao: parsed.data.descricao ?? null,
    foto: parsed.data.foto ?? null,
    email: parsed.data.email ?? null,
    telefone: parsed.data.telefone ?? null,
    link_professor: parsed.data.linkProfessor ?? null,
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .update(updatePayload)
    .eq("id", id)
    .select(
      "id,nome,titulacao,descricao,foto,email,telefone,link_professor,created_at,updated_at",
    )
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ??
          "Não foi possível atualizar os dados do professor informado.",
      },
      { status: 500 },
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, message: "Professor não encontrado." },
      { status: 404 },
    )
  }

  return NextResponse.json({
    success: true,
    professor: mapProfessor(data),
  })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Informe o ID do professor a ser removido." },
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
        message: error.message ?? "Não foi possível remover o professor.",
      },
      { status: 500 },
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, message: "Professor não encontrado." },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true })
}
