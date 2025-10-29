import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

import {
  getProfileFromToken,
  updateUserProfile,
} from "@/services/auth/auth-service"

const AUTH_COOKIE = "ui-admin-token"

const optionalString = (max: number) =>
  z
    .union([
      z
        .string()
        .trim()
        .max(max, `Texto muito longo (máximo de ${max} caracteres)`),
      z.literal(""),
    ])
    .optional()

const optionalUrl = z
  .union([
    z
      .string()
      .trim()
      .url("Informe uma URL válida")
      .max(1024, "URL muito longa"),
    z.literal(""),
  ])
  .optional()

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe um nome")
    .max(120, "O nome pode ter no máximo 120 caracteres"),
  displayName: optionalString(80),
  avatarUrl: optionalUrl,
  avatar: optionalString(1024),
  bio: optionalString(280),
})

export async function PATCH(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Não autenticado." },
      { status: 401 }
    )
  }

  const currentUser = await getProfileFromToken(token)
  if (!currentUser) {
    return NextResponse.json(
      { success: false, message: "Sessão inválida." },
      { status: 401 }
    )
  }

  const body = await request.json().catch(() => null)
  const parsed = profileSchema.safeParse(body)

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
    const { name, displayName, avatarUrl, avatar, bio } = parsed.data

    const updatedUser = await updateUserProfile(currentUser.id, {
      name,
      displayName:
        displayName && displayName.trim().length > 0
          ? displayName.trim()
          : undefined,
      avatarUrl:
        avatarUrl && avatarUrl.trim().length > 0 ? avatarUrl.trim() : undefined,
      avatar:
        avatar && avatar.trim().length > 0 ? avatar.trim() : undefined,
      bio: bio && bio.trim().length > 0 ? bio.trim() : undefined,
    })
    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível atualizar o perfil."
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value
  const profile = await getProfileFromToken(token)

  if (!profile) {
    return NextResponse.json(
      { success: false, message: "Não autenticado." },
      { status: 401 }
    )
  }

  return NextResponse.json({ success: true, user: profile })
}
