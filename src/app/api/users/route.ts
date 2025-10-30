import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

import {
  createUserAccount,
  getProfileFromToken,
  listSupabaseUsers,
  updateUserAccount,
  PerfilUsuario,
} from "@/services/auth/auth-service"

const AUTH_COOKIE = "ui-admin-token"

const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres"),
  email: z.string().trim().email("Informe um e-mail válido"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres.")
    .max(72, "A senha pode ter no máximo 72 caracteres."),
  perfil: z.nativeEnum(PerfilUsuario),
  status: z.enum(["active", "inactive"]).default("active"),
  avatarDataUrl: z
    .union([
      z
        .string()
        .trim()
        .refine(
          (value) => value.length === 0 || value.startsWith("data:image/"),
          "Formato de imagem inválido"
        ),
      z.literal(""),
    ])
    .optional(),
})

const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres"),
  email: z.string().trim().email("Informe um e-mail válido"),
  perfil: z.nativeEnum(PerfilUsuario),
  status: z.enum(["active", "inactive"]),
  avatarDataUrl: z
    .union([
      z
        .string()
        .trim()
        .refine(
          (value) => value.length === 0 || value.startsWith("data:image/"),
          "Formato de imagem inválido"
        ),
      z.literal(""),
    ])
    .optional(),
})

export async function GET(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Não autenticado." },
      { status: 401 }
    )
  }

  const currentUser = await getProfileFromToken(token)
  if (!currentUser || currentUser.perfil !== PerfilUsuario.Admin) {
    return NextResponse.json(
      { success: false, message: "Apenas administradores podem visualizar usuários." },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("id")

  try {
    const users = await listSupabaseUsers()

    if (userId) {
      const user = users.find((item) => item.id === userId)
      if (!user) {
        return NextResponse.json(
          { success: false, message: "Usuário não encontrado." },
          { status: 404 }
        )
      }

      return NextResponse.json({ success: true, user })
    }

    return NextResponse.json({ success: true, users })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível listar os usuários."
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Não autenticado." },
      { status: 401 }
    )
  }

  const currentUser = await getProfileFromToken(token)
  if (!currentUser || currentUser.perfil !== PerfilUsuario.Admin) {
    return NextResponse.json(
      { success: false, message: "Apenas administradores podem criar usuários." },
      { status: 403 }
    )
  }

  const payload = await request.json().catch(() => null)
  const parsed = createUserSchema.safeParse(payload)

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

  try {
    const { avatarDataUrl, ...userData } = parsed.data
    const user = await createUserAccount({
      ...userData,
      avatarDataUrl:
        avatarDataUrl && avatarDataUrl.trim().length > 0
          ? avatarDataUrl.trim()
          : undefined,
    })
    return NextResponse.json({ success: true, user })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível criar o usuário."
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const url = new URL(request.url)
  const userId = url.searchParams.get("id")

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "ID do usuário inválido." },
      { status: 400 }
    )
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Não autenticado." },
      { status: 401 }
    )
  }

  const currentUser = await getProfileFromToken(token)
  if (!currentUser || currentUser.perfil !== PerfilUsuario.Admin) {
    return NextResponse.json(
      { success: false, message: "Apenas administradores podem atualizar usuários." },
      { status: 403 }
    )
  }

  const payload = await request.json().catch(() => null)
  const parsed = updateUserSchema.safeParse(payload)

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

  try {
    const { avatarDataUrl, ...data } = parsed.data
    const updatedUser = await updateUserAccount({
      id: userId,
      ...data,
      avatarDataUrl:
        avatarDataUrl && avatarDataUrl.trim().length > 0
          ? avatarDataUrl.trim()
          : undefined,
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível atualizar o usuário."

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    )
  }
}
