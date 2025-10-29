import type { Metadata } from "next"

import { ProfilePageClient } from "./profile-page-client"

export const metadata: Metadata = {
  title: "Meu Perfil - FAFIH Dashboard",
  description: "Atualize seus dados pessoais e preferências.",
}

export default function ProfilePage() {
  return <ProfilePageClient />
}
