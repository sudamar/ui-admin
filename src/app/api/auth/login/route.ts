import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { translateAuthErrorCode, translateAuthStatus } from "@/features/auth/lib/auth-error"
import { signInWithEmailAndPassword } from "@/services/auth/auth-service"

const verifyTurnstileToken = async (token: string | undefined | null) => {
  const secret = process.env.NEXT_TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.warn("[Auth][Turnstile] Secret key não configurada.")
    return process.env.NODE_ENV !== "production"
  }

  if (!token) {
    return false
  }

  const params = new URLSearchParams()
  params.append("secret", secret)
  params.append("response", token)

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: params,
    })
    const data = (await response.json()) as { success: boolean }
    return Boolean(data.success)
  } catch (error) {
    console.error("[Auth][Turnstile] Falha ao validar token:", error)
    return false
  }
}

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
  const turnstileToken = (payload as { turnstileToken?: string }).turnstileToken

  const isValidToken = await verifyTurnstileToken(turnstileToken)
  if (!isValidToken) {
    return NextResponse.json(
      {
        success: false,
        message: "Não foi possível validar o Turnstile. Tente novamente.",
      },
      { status: 400 },
    )
  }

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
