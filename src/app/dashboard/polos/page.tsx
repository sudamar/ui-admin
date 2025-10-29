import type { Metadata } from "next"

import { PolosPageClient } from "./polos-page-client"

export const metadata: Metadata = {
  title: "Polos - FAFIH Dashboard",
  description: "Gerencie os polos da FAFIH.",
}

export default function PolosPage() {
  return <PolosPageClient />
}
