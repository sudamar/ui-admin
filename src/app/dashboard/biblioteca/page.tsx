import type { Metadata } from "next"

import { BibliotecaPageClient } from "./biblioteca-page-client"

export const metadata: Metadata = {
  title: "Biblioteca - FAFIH Dashboard",
  description: "Gerencie os trabalhos da FAFIH.",
}

export default function BibliotecaPage() {
  return <BibliotecaPageClient />
}
