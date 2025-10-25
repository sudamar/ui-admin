import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "admin@example.com"
const demoPassword = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "admin123"

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)

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

  // Pequena espera para simular requisição externa.
  await new Promise((resolve) => setTimeout(resolve, 400))

  if (email !== demoEmail || password !== demoPassword) {
    return NextResponse.json(
      {
        success: false,
        message: "Credenciais inválidas. Utilize o acesso demo informado.",
      },
      { status: 401 }
    )
  }

  const token = Buffer.from(`${email}:${Date.now()}`).toString("base64")

  return NextResponse.json({
    success: true,
    token,
  })
}
