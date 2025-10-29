import { NextResponse } from "next/server"

const AUTH_COOKIE = "ui-admin-token"

export async function POST() {
  const response = NextResponse.json({ success: true })

  response.cookies.set({
    name: AUTH_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })

  return response
}
