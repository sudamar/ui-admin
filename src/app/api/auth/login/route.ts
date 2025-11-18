import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { translateAuthErrorCode, translateAuthStatus } from "@/features/auth/lib/auth-error"
import { signInWithEmailAndPassword } from "@/services/auth/auth-service"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => null)) as unknown

  const parseResult = credentialsSchema.safeParse(payload)
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        message: "Dados de login inválidos.",
        issues: parseResult.error.issues,
      },
      { status: 400 }
    )
  }

  const { email, password } = parseResult.data

  const { session, user, error } = await signInWithEmailAndPassword(
    email,
    password
  )

  if (error || !session || !user) {
    return NextResponse.json(
      {
        success: false,
        message: translateAuthErrorCode(error?.code) ?? translateAuthStatus(error?.status) ?? "Não foi possível realizar o login. Verifique suas credenciais.",
      },
      { status: 401 }
    )
  }

  const response = NextResponse.json({
    success: true,
    user,
  })

  response.cookies.set({
    name: "ui-admin-token",
    value: session.access_token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.expires_in ?? 60 * 60,
  })

  if (session.refresh_token) {
    response.cookies.set({
      name: "ui-admin-refresh",
      value: session.refresh_token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  return response
}
