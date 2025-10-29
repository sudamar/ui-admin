import type { Metadata } from "next"

import { CursosPageClient } from "./cursos-page-client"

export const metadata: Metadata = {
  title: "Cursos - FAFIH Dashboard",
  description: "Gerencie os cursos da FAFIH.",
}

export default function CursosPage() {
  return <CursosPageClient />
}
