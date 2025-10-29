import type { Metadata } from "next"

import { UsersPageClient } from "./users-page-client"

export const metadata: Metadata = {
  title: "Usuários - FAFIH Dashboard",
  description: "Gerencie os usuários da FAFIH.",
}

export default function UsersPage() {
  return <UsersPageClient />
}
