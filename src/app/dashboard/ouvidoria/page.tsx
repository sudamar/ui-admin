import type { Metadata } from "next"

import { OuvidoriaPageClient } from "./ouvidoria-page-client"

export const metadata: Metadata = {
  title: "Ouvidoria - FAFIH Dashboard",
  description: "Gerencie e acompanhe os chamados de ouvidoria.",
}

export default function OuvidoriaPage() {
  return <OuvidoriaPageClient />
}
