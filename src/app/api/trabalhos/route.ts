import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

import {
  getProfileFromToken,
  PerfilUsuario,
} from "@/services/auth/auth-service"

const AUTH_COOKIE = "ui-admin-token"
const TABLE_NAME = "trabalhos"

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

const trabalhoSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(2, "Informe o título do trabalho."),
  autor: z
    .string()
    .trim()
    .min(2, "Informe o autor do trabalho."),
  slug: z
    .string()
    .trim()
    .min(2, "Informe o slug do trabalho."),
  data_publicacao: z
    .string()
    .trim()
    .min(1, "Informe a data de publicação."),
  link: z
    .string()
    .trim()
    .url("Informe uma URL válida."),
  tags: z
    .array(z.string())
    .min(1, "Selecione pelo menos uma tag."),
  resumo: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  nota: z
    .number()
    .min(0)
    .max(999)
    .optional()
    .nullable(),
  visitantes: z
    .number()
    .min(0)
    .optional()
    .default(0),
  baixados: z
    .number()
    .min(0)
    .optional()
    .nullable(),
})

type TrabalhoRow = {
  id: string
  titulo: string
  autor: string
  slug: string
  data_publicacao: string
  link: string
  resumo: string | null
  nota: number | null
  visitantes: number
  baixados: number | null
  created_at?: string
  updated_at?: string
}

type TrabalhoDTO = {
  id: string
  titulo: string
  autor: string
  slug: string
  data_publicacao: string
  link: string
  tags: string[]
  resumo?: string | null
  nota?: number | null
  visitantes: number
  baixados?: number | null
}

function mapTrabalho(row: TrabalhoRow): Omit<TrabalhoDTO, 'tags'> {
  return {
    id: row.id,
    titulo: row.titulo,
    autor: row.autor,
    slug: row.slug,
    data_publicacao: row.data_publicacao,
    link: row.link,
    resumo: row.resumo,
    nota: row.nota,
    visitantes: row.visitantes,
    baixados: row.baixados,
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

  if (!currentUser || 
    (currentUser.perfil !== PerfilUsuario.Secretaria
    && currentUser.perfil !== PerfilUsuario.Admin)
  ) {
    return {
      isAdmin: false,
      response: NextResponse.json(
        {
          success: false,
          message: "Apenas administradores podem gerenciar trabalhos.",
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
  const slug = searchParams.get("slug")

  // Buscar trabalhos
  let queryTrabalhos = supabaseAdmin
    .from(TABLE_NAME)
    .select("*")
    .order("data_publicacao", { ascending: false })

  if (id) {
    queryTrabalhos = queryTrabalhos.eq("id", id)
  } else if (slug) {
    queryTrabalhos = queryTrabalhos.eq("slug", slug)
  }

  const { data: trabalhosData, error: trabalhosError } = await queryTrabalhos

  if (trabalhosError) {
    return NextResponse.json(
      {
        success: false,
        message: trabalhosError.message ?? "Não foi possível carregar os trabalhos.",
      },
      { status: 500 }
    )
  }

  if (!trabalhosData || trabalhosData.length === 0) {
    if (id || slug) {
      return NextResponse.json(
        { success: false, message: "Trabalho não encontrado." },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, trabalhos: [] })
  }

  // Buscar categorias relacionadas
  const trabalhoIds = trabalhosData.map(t => t.id)
  const { data: categoriasRelacionadas, error: categoriasError } = await supabaseAdmin
    .from("trabalho_categorizados")
    .select(`
      trabalho_id,
      categoria:categorias_trabalhos(id,nome,icone,cor)
    `)
    .in("trabalho_id", trabalhoIds)

  if (categoriasError) {
    console.error("Erro ao buscar categorias:", categoriasError)
  }

  // Mapear categorias por trabalho
  const categoriasPorTrabalho = new Map<string, Array<{ id: string; nome: string }>>()
  if (categoriasRelacionadas) {
    categoriasRelacionadas.forEach((rel: any) => {
      if (!categoriasPorTrabalho.has(rel.trabalho_id)) {
        categoriasPorTrabalho.set(rel.trabalho_id, [])
      }
      if (rel.categoria?.id && rel.categoria?.nome) {
        categoriasPorTrabalho.get(rel.trabalho_id)!.push({
          id: rel.categoria.id,
          nome: rel.categoria.nome,
        })
      }
    })
  }

  // Adicionar tags aos trabalhos
  const trabalhos = trabalhosData.map(trabalho => ({
    ...mapTrabalho(trabalho),
    tags: categoriasPorTrabalho.get(trabalho.id)?.map((categoria) => categoria.nome) || []
  }))

  if (id || slug) {
    return NextResponse.json({ success: true, trabalho: trabalhos[0] })
  }

  return NextResponse.json({ success: true, trabalhos })
}

export async function POST(request: Request) {
  const { isAdmin, response } = await ensureAdmin()
  if (!isAdmin) {
    return response
  }

  const payload = await request.json().catch(() => null)

  if (!payload) {
    console.error("[API][Trabalhos][POST] Payload ausente ou inválido.")
    return NextResponse.json(
      {
        success: false,
        message: "Payload inválido.",
      },
      { status: 400 }
    )
  }

  const parsed = trabalhoSchema.safeParse(payload)

  if (!parsed.success) {
    console.error("[API][Trabalhos][POST] Validação falhou:", parsed.error.flatten())
    return NextResponse.json(
      {
        success: false,
        message: "Dados inválidos.",
        issues: parsed.error.issues,
      },
      { status: 400 }
    )
  }

  console.log("[API][Trabalhos][POST] Payload válido:", parsed.data)

  // 1. Criar o trabalho
  const { data: trabalhoData, error: trabalhoError } = await supabaseAdmin
    .from(TABLE_NAME)
    .insert({
      titulo: parsed.data.titulo,
      autor: parsed.data.autor,
      slug: parsed.data.slug,
      data_publicacao: parsed.data.data_publicacao,
      link: parsed.data.link,
      resumo: parsed.data.resumo ?? null,
      nota: parsed.data.nota ?? null,
      visitantes: parsed.data.visitantes ?? 0,
      baixados: parsed.data.baixados ?? null,
    })
    .select("*")
    .maybeSingle()

  if (trabalhoError || !trabalhoData) {
    console.error("[API][Trabalhos][POST] Erro ao inserir trabalho:", trabalhoError)
    return NextResponse.json(
      {
        success: false,
        message:
          trabalhoError?.message ??
          "Não foi possível criar o trabalho. Tente novamente.",
      },
      { status: 500 }
    )
  }

  // 2. Buscar IDs das categorias pelos slugs
  const { data: categorias, error: categoriasError } = await supabaseAdmin
    .from("categorias_trabalhos")
    .select("id, nome")
    .in("nome", parsed.data.tags)

  if (categoriasError) {
    console.error("[API][Trabalhos][POST] Erro ao buscar categorias:", categoriasError)
  }

  // 3. Inserir relacionamentos
  if (categorias && categorias.length > 0) {
    const relacionamentos = categorias.map(cat => ({
      trabalho_id: trabalhoData.id,
      categoria_id: cat.id,
    }))

    const { error: relError } = await supabaseAdmin
      .from("trabalho_categorizados")
      .insert(relacionamentos)

    if (relError) {
      console.error("[API][Trabalhos][POST] Erro ao criar relacionamentos:", relError)
    }
  }

  return NextResponse.json({
    success: true,
    trabalho: {
      ...mapTrabalho(trabalhoData),
      tags: parsed.data.tags,
    },
  })
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Informe o ID do trabalho que deseja atualizar.",
      },
      { status: 400 }
    )
  }

  const { isAdmin, response } = await ensureAdmin()
  if (!isAdmin) {
    return response
  }

  const payload = await request.json().catch(() => null)

  if (!payload) {
    console.error("[API][Trabalhos][PATCH] Payload ausente ou inválido.")
    return NextResponse.json(
      {
        success: false,
        message: "Payload inválido.",
      },
      { status: 400 }
    )
  }

  const parsed = trabalhoSchema.safeParse(payload)

  if (!parsed.success) {
    console.error("[API][Trabalhos][PATCH] Validação falhou:", parsed.error.flatten())
    return NextResponse.json(
      {
        success: false,
        message: "Dados inválidos.",
        issues: parsed.error.issues,
      },
      { status: 400 }
    )
  }

  console.log("[API][Trabalhos][PATCH] Atualizando trabalho:", { id, payload: parsed.data })

  // 1. Atualizar o trabalho
  const { data: trabalhoData, error: trabalhoError } = await supabaseAdmin
    .from(TABLE_NAME)
    .update({
      titulo: parsed.data.titulo,
      autor: parsed.data.autor,
      slug: parsed.data.slug,
      data_publicacao: parsed.data.data_publicacao,
      link: parsed.data.link,
      resumo: parsed.data.resumo ?? null,
      nota: parsed.data.nota ?? null,
    })
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (trabalhoError) {
    console.error("[API][Trabalhos][PATCH] Erro ao atualizar trabalho:", trabalhoError)
    return NextResponse.json(
      {
        success: false,
        message:
          trabalhoError.message ?? "Não foi possível atualizar o trabalho informado.",
      },
      { status: 500 }
    )
  }

  if (!trabalhoData) {
    console.error("[API][Trabalhos][PATCH] Trabalho não encontrado AO atualizar", { id })
    return NextResponse.json(
      {
        success: false,
        message: "Trabalho não encontrado.",
      },
      { status: 404 }
    )
  }

  // 2. Remover relacionamentos antigos
  await supabaseAdmin
    .from("trabalho_categorizados")
    .delete()
    .eq("trabalho_id", id)

  // 3. Buscar IDs das novas categorias
  const { data: categorias, error: categoriasError } = await supabaseAdmin
    .from("categorias_trabalhos")
    .select("id, nome")
    .in("nome", parsed.data.tags)

  if (categoriasError) {
    console.error("[API][Trabalhos][PATCH] Erro ao buscar categorias:", categoriasError)
  }

  // 4. Inserir novos relacionamentos
  if (categorias && categorias.length > 0) {
    const relacionamentos = categorias.map(cat => ({
      trabalho_id: id,
      categoria_id: cat.id,
    }))

    const { error: relError } = await supabaseAdmin
      .from("trabalho_categorizados")
      .insert(relacionamentos)

    if (relError) {
      console.error("[API][Trabalhos][PATCH] Erro ao criar relacionamentos:", relError)
    }
  }

  return NextResponse.json({
    success: true,
    trabalho: {
      ...mapTrabalho(trabalhoData),
      tags: parsed.data.tags,
    },
  })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Informe o ID do trabalho a ser removido." },
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
        message: error.message ?? "Não foi possível remover o trabalho.",
      },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
