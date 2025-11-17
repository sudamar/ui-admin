import type { Metadata } from "next"

import { OuvidoriaDetailPageClient } from "./ouvidoria-detail-page-client"

export const metadata: Metadata = {
  title: "Atendimento da ouvidoria",
}

type PageProps = {
  params: { id: string } | Promise<{ id: string }>
}

export default async function OuvidoriaDetailPage({ params }: PageProps) {
  const resolvedParams = await params
  return <OuvidoriaDetailPageClient chamadoId={resolvedParams.id} />
}
