import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { z } from "zod"

import {
  createUserAccount,
  getProfileFromToken,
  PerfilUsuario,
} from "@/services/auth/auth-service"

const AUTH_COOKIE = "ui-admin-token"

const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres"),
  email: z.string().trim().email("Informe um e-mail válido"),
  perfil: z.nativeEnum(PerfilUsuario),
  status: z.enum(["active", "inactive"]).default("active"),
})

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
    const user = await createUserAccount(parsed.data)
    return NextResponse.json({ success: true, user })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível criar o usuário."
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
