import { DashboardPageClient } from "./dashboard-page-client"
import { getDashboardSummaryCached } from "@/services/dashboard/dashboard-summary-service"

async function loadDashboardSummary() {
  try {
    return await getDashboardSummaryCached()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("[Dashboard] Erro ao carregar resumo:", message)
    return null
  }
}

export default async function DashboardPage() {
  const summary = await loadDashboardSummary()

  return <DashboardPageClient summary={summary} />
}
