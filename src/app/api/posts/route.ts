import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const TABLE_NAME = "posts"

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

const postSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug obrigatório")
    .max(255, "Slug muito longo")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Utilize apenas letras minúsculas, números e hífens"),
  title: z.string().trim().min(3, "Título obrigatório"),
  date: z.string().trim().min(4, "Data obrigatória"),
  excerpt: z.string().nullish(),
  content: z.string().nullish(),
  image: z.string().nullish(),
  published: z.boolean().nullish(),
  author: z.string().nullish(),
  author_info: z.any().optional(),
})

type PostPayload = z.infer<typeof postSchema>

type PostRow = {
  id: string
  slug: string
  title: string
  date: string
  author: string | null
  author_info: Record<string, unknown> | null
  excerpt: string | null
  content: string | null
  image: string | null
  published: boolean | null
  created_at: string | null
  updated_at: string | null
}

const mapRow = (row: PostRow) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  date: row.date,
  author: row.author ?? "",
  authorInfo: row.author_info ?? undefined,
  excerpt: row.excerpt ?? "",
  content: row.content ?? "",
  image: row.image ?? "",
  published: Boolean(row.published),
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const slug = searchParams.get("slug")
  const search = searchParams.get("search")?.trim()
  const publishedFilter = searchParams.get("published")
  const orderBy = searchParams.get("orderBy") ?? "date"
  const orderDir = searchParams.get("orderDir") === "asc" ? "asc" : "desc"

  let query = supabaseAdmin.from(TABLE_NAME).select("*")

  if (id) {
    query = query.eq("id", id).limit(1)
  } else if (slug) {
    query = query.eq("slug", slug).limit(1)
  } else {
    if (search) {
      const ilike = `%${search}%`
      query = query.or(`title.ilike.${ilike},excerpt.ilike.${ilike},content.ilike.${ilike}`)
    }

    if (publishedFilter === "published") {
      query = query.eq("published", true)
    } else if (publishedFilter === "draft") {
      query = query.eq("published", false)
    }

    query = query.order(orderBy, { ascending: orderDir === "asc" }).order("updated_at", { ascending: false })
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }

  if (id || slug) {
    const post = data?.[0]
    if (!post) {
      return NextResponse.json({ success: false, message: "Post não encontrado." }, { status: 404 })
    }
    return NextResponse.json({ success: true, post: mapRow(post as PostRow) })
  }

  return NextResponse.json({ success: true, posts: (data ?? []).map(mapRow) })
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as PostPayload | null
  if (!body) {
    return NextResponse.json({ success: false, message: "Payload inválido." }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues.map((issue) => issue.message).join(", ") }, { status: 400 })
  }

  const insertPayload = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    date: parsed.data.date,
    author: parsed.data.author ?? null,
    author_info: parsed.data.author_info ?? null,
    excerpt: parsed.data.excerpt ?? null,
    content: parsed.data.content ?? null,
    image: parsed.data.image ?? null,
    published: parsed.data.published ?? true,
  }

  const { data, error } = await supabaseAdmin.from(TABLE_NAME).insert(insertPayload).select("*").maybeSingle()
  if (error || !data) {
    return NextResponse.json({ success: false, message: error?.message ?? "Não foi possível criar o post." }, { status: 500 })
  }

  return NextResponse.json({ success: true, post: mapRow(data as PostRow) })
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ success: false, message: "Informe o ID do post." }, { status: 400 })
  }

  const body = (await request.json().catch(() => null)) as PostPayload | null
  if (!body) {
    return NextResponse.json({ success: false, message: "Payload inválido." }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues.map((issue) => issue.message).join(", ") }, { status: 400 })
  }

  const updatePayload = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    date: parsed.data.date,
    author: parsed.data.author ?? null,
    author_info: parsed.data.author_info ?? null,
    excerpt: parsed.data.excerpt ?? null,
    content: parsed.data.content ?? null,
    image: parsed.data.image ?? null,
    published: parsed.data.published ?? true,
  }

  const { data, error } = await supabaseAdmin.from(TABLE_NAME).update(updatePayload).eq("id", id).select("*").maybeSingle()
  if (error || !data) {
    return NextResponse.json({ success: false, message: error?.message ?? "Não foi possível atualizar o post." }, { status: 500 })
  }

  return NextResponse.json({ success: true, post: mapRow(data as PostRow) })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ success: false, message: "Informe o ID do post." }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from(TABLE_NAME).delete().eq("id", id)
  if (error) {
    return NextResponse.json({ success: false, message: error.message ?? "Não foi possível remover o post." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
