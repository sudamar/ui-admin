import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { getProfileFromToken } from "@/services/auth/auth-service"

const AUTH_COOKIE = "ui-admin-token"

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

  return NextResponse.json({
    success: true,
    user: profile,
  })
}
