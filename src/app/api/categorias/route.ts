import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

import {
  getProfileFromToken,
  PerfilUsuario,
} from "@/services/auth/auth-service"

const AUTH_COOKIE = "ui-admin-token"
const TABLE_NAME = "categorias_trabalhos"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY) must be configured."
  )
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const categoriaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe o nome da categoria."),
  icone: z
    .string()
    .trim()
    .max(100, "Nome do ícone muito longo.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  cor: z
    .string()
    .trim()
    .max(120, "Valor de cor muito longo.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
})

type CategoriaRow = {
  id: string
  nome: string
  icone: string | null
  cor: string | null
}

type CategoriaDTO = {
  id: string
  nome: string
  icone?: string | null
  cor?: string | null
}

function mapCategoria(row: CategoriaRow): CategoriaDTO {
  return {
    id: row.id,
    nome: row.nome,
    icone: row.icone,
    cor: row.cor,
  }
}

async function ensureAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value

  if (!token) {
    return {
      isAdmin: false,
      response: NextResponse.json(
        { success: false, message: "Não autenticado." },
        { status: 401 }
      ),
    }
  }

  const currentUser = await getProfileFromToken(token)

  if (!currentUser || currentUser.perfil !== PerfilUsuario.Admin) {
    return {
      isAdmin: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Apenas administradores podem gerenciar categorias.",
        },
        { status: 403 }
      ),
    }
  }

  return { isAdmin: true as const, response: null }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  const query = supabaseAdmin
    .from(TABLE_NAME)
    .select("id,nome,icone,cor")
    .order("nome", { ascending: true })

  if (id) {
    query.eq("id", id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message ?? "Não foi possível carregar as categorias.",
      },
      { status: 500 }
    )
  }

  const categorias = (data ?? []).map(mapCategoria)

  if (id) {
    const categoria = categorias[0]
    if (!categoria) {
      return NextResponse.json(
        { success: false, message: "Categoria não encontrada." },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, categoria })
  }

  return NextResponse.json({ success: true, categorias })
}

export async function POST(request: Request) {
  const { isAdmin, response } = await ensureAdmin()
  if (!isAdmin) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const parsed = categoriaSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Dados inválidos.",
        issues: parsed.error.issues,
      },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .insert({
      nome: parsed.data.nome,
      icone: parsed.data.icone ?? null,
      cor: parsed.data.cor ?? null,
    })
    .select("id,nome,icone,cor")
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ??
          "Não foi possível criar a categoria. Tente novamente.",
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    categoria: mapCategoria(data),
  })
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Informe o ID da categoria que deseja atualizar.",
      },
      { status: 400 }
    )
  }

  const { isAdmin, response } = await ensureAdmin()
  if (!isAdmin) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const parsed = categoriaSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Dados inválidos.",
        issues: parsed.error.issues,
      },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .update({
      nome: parsed.data.nome,
      icone: parsed.data.icone ?? null,
      cor: parsed.data.cor ?? null,
    })
    .eq("id", id)
    .select("id,nome,icone,cor")
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ?? "Não foi possível atualizar a categoria informada.",
      },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      {
        success: false,
        message: "Categoria não encontrada.",
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    categoria: mapCategoria(data),
  })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Informe o ID da categoria a ser removida." },
      { status: 400 }
    )
  }

  const { isAdmin, response } = await ensureAdmin()
  if (!isAdmin) {
    return response
  }

  const { error } = await supabaseAdmin
    .from(TABLE_NAME)
    .delete()
    .eq("id", id)

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message ?? "Não foi possível remover a categoria.",
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
