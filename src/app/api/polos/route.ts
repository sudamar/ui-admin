import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

import { getProfileFromToken, PerfilUsuario } from "@/services/auth/auth-service"

const AUTH_COOKIE = "ui-admin-token"
const TABLE_NAME = "polos"

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

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const poloSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Informe um slug contendo ao menos 2 caracteres.")
    .max(100, "O slug pode ter no máximo 100 caracteres.")
    .regex(
      slugRegex,
      "Use apenas letras minúsculas, números e hífens (ex: belo-horizonte).",
    )
    .optional()
    .or(z.literal("").transform(() => undefined)),
  name: z.string().trim().min(3, "Informe o nome do polo."),
  address: z
    .string()
    .trim()
    .min(5, "Informe um endereço válido.")
    .optional()
    .or(z.literal("").transform(() => undefined))
    .or(z.null().transform(() => undefined)),
  phone: z
    .string()
    .trim()
    .min(5, "Informe um telefone válido.")
    .optional()
    .or(z.literal("").transform(() => undefined))
    .or(z.null().transform(() => undefined)),
  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .optional()
    .or(z.literal("").transform(() => undefined))
    .or(z.null().transform(() => undefined)),
  coordinator: z
    .string()
    .trim()
    .min(3, "Informe o coordenador responsável.")
    .optional()
    .or(z.literal("").transform(() => undefined))
    .or(z.null().transform(() => undefined)),
  mapUrl: z
    .string()
    .trim()
    .url("Informe uma URL válida para o mapa.")
    .optional()
    .or(z.literal("").transform(() => undefined))
    .or(z.null().transform(() => undefined)),
})

type PoloPayload = z.infer<typeof poloSchema>

type PoloRow = {
  id: string
  slug: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
  coordinator: string | null
  map_url: string | null
  created_at?: string | null
  updated_at?: string | null
}

type PoloDto = {
  id: string
  slug: string
  name: string
  address?: string
  phone?: string
  email?: string
  coordinator?: string
  mapUrl?: string
}

function mapPolo(row: PoloRow): PoloDto {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    coordinator: row.coordinator ?? undefined,
    mapUrl: row.map_url ?? undefined,
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
          message: "Apenas administradores podem gerenciar polos.",
        },
        { status: 403 },
      ),
    }
  }

  return { authorized: true as const, response: null }
}

const slugify = (input: string) =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

const generatePoloSlug = (name: string) => {
  const base = slugify(name)
  if (base.length > 0) {
    return base
  }
  const random = Math.random().toString(36).slice(2, 8)
  return `polo-${Date.now()}-${random}`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  let query = supabaseAdmin
    .from(TABLE_NAME)
    .select("id,slug,name,address,phone,email,coordinator,map_url")
    .order("name", { ascending: true })

  if (id) {
    query = query.eq("id", id).limit(1)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message ?? "Não foi possível carregar os polos.",
      },
      { status: 500 },
    )
  }

  const polos = (data ?? []).map(mapPolo)

  if (id) {
  const polo = polos[0]
    if (!polo) {
      return NextResponse.json(
        { success: false, message: "Polo não encontrado." },
        { status: 404 },
      )
    }
    return NextResponse.json({ success: true, polo })
  }

  return NextResponse.json({ success: true, polos })
}

export async function POST(request: Request) {
  const { authorized, response } = await ensureAuthorized()
  if (!authorized) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const parsed = poloSchema.safeParse(payload)

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

  const slug = parsed.data.slug ?? generatePoloSlug(parsed.data.name)

  const insertPayload = {
    slug,
    name: parsed.data.name,
    address: parsed.data.address ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    coordinator: parsed.data.coordinator ?? null,
    map_url: parsed.data.mapUrl ?? null,
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .insert(insertPayload)
    .select("id,slug,name,address,phone,email,coordinator,map_url")
    .maybeSingle()

  if (error || !data) {
    return NextResponse.json(
      {
        success: false,
        message:
          error?.message ??
          "Não foi possível criar o polo. Tente novamente.",
      },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    polo: mapPolo(data),
  })
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      {
        success: false,
        message: "Informe o ID do polo que deseja atualizar.",
      },
      { status: 400 },
    )
  }

  const { authorized, response } = await ensureAuthorized()
  if (!authorized) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const parsed = poloSchema.safeParse(payload)

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

  const slug = parsed.data.slug ?? generatePoloSlug(parsed.data.name)

  const updatePayload = {
    slug,
    name: parsed.data.name,
    address: parsed.data.address ?? null,
    phone: parsed.data.phone ?? null,
    email: parsed.data.email ?? null,
    coordinator: parsed.data.coordinator ?? null,
    map_url: parsed.data.mapUrl ?? null,
  }

  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .update(updatePayload)
    .eq("id", id)
    .select("id,slug,name,address,phone,email,coordinator,map_url")
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error.message ?? "Não foi possível atualizar o polo informado.",
      },
      { status: 500 },
    )
  }

  if (!data) {
    return NextResponse.json(
      {
        success: false,
        message: "Polo não encontrado.",
      },
      { status: 404 },
    )
  }

  return NextResponse.json({
    success: true,
    polo: mapPolo(data),
  })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Informe o ID do polo a ser removido." },
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
        message: error.message ?? "Não foi possível remover o polo.",
      },
      { status: 500 },
    )
  }

  if (!data) {
    return NextResponse.json(
      {
        success: false,
        message: "Polo não encontrado.",
      },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true })
}
