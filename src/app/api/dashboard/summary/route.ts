import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getProfileFromToken, PerfilUsuario } from "@/services/auth/auth-service"
import { getDashboardSummaryCached } from "@/services/dashboard/dashboard-summary-service"

const AUTH_COOKIE = "ui-admin-token"

async function ensureAuthorized() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE)?.value

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json({ success: false, message: "Não autenticado." }, { status: 401 }),
    }
  }

  const currentUser = await getProfileFromToken(token)
  if (
    !currentUser ||
    (currentUser.perfil !== PerfilUsuario.Admin && currentUser.perfil !== PerfilUsuario.Secretaria)
  ) {
    return {
      authorized: false,
      response: NextResponse.json({ success: false, message: "Acesso negado." }, { status: 403 }),
    }
  }

  return { authorized: true as const }
}

export async function GET() {
  const auth = await ensureAuthorized()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const summary = await getDashboardSummaryCached()
    return NextResponse.json({ success: true, data: summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível carregar os dados do dashboard."
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}
