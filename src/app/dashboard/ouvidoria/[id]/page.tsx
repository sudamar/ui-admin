import type { Metadata } from "next"

import { OuvidoriaDetailPageClient } from "./ouvidoria-detail-page-client"

export const metadata: Metadata = {
  title: "Atendimento da ouvidoria",
}

type PageProps = {
  params: { id: string } | Promise<{ id: string }>
  searchParams: { acao?: string } | Promise<{ acao?: string }>
}

export default async function OuvidoriaDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearch = await searchParams

  return <OuvidoriaDetailPageClient chamadoId={resolvedParams.id} acao={resolvedSearch?.acao} />
}
