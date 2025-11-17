export type OuvidoriaStatus = "Enviado" | "Em atendimento" | "Finalizado"
export const OUVIDORIA_STATUS: OuvidoriaStatus[] = ["Enviado", "Em atendimento", "Finalizado"]

export interface OuvidoriaEntry {
  id: string
  identificacaoTipo: string
  nomeCompleto: string | null
  email: string | null
  telefone: string | null
  vinculo: string | null
  tipoManifestacao: string
  assunto: string
  mensagem: string
  createdAt: string | null
  status: OuvidoriaStatus
  responsavelId: string | null
  responsavelNome: string | null
  reply: string | null
}

type OuvidoriaListResponse =
  | { success: true; chamados: OuvidoriaEntry[] }
  | { success: true; chamado: OuvidoriaEntry }
  | { success: false; message?: string }

const API_URL = "/api/ouvidoria"

async function handleResponse(response: Response) {
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(errorBody?.message ?? "Não foi possível processar a solicitação.")
  }

  const result = (await response.json()) as OuvidoriaListResponse
  if (!("success" in result) || !result.success) {
    throw new Error(result.message ?? "Falha ao carregar chamados.")
  }
  return result
}

export const ouvidoriaService = {
  async getAll(): Promise<OuvidoriaEntry[]> {
    const response = await fetch(API_URL, {
      cache: "no-store",
      credentials: "include",
    })

    const result = await handleResponse(response)
    if ("chamados" in result) {
      return result.chamados
    }
    return result.chamado ? [result.chamado] : []
  },

  async getById(id: string): Promise<OuvidoriaEntry | null> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      cache: "no-store",
      credentials: "include",
    })

    if (response.status === 404) {
      return null
    }

    const result = await handleResponse(response)
    if ("chamado" in result) {
      return result.chamado
    }
    return result.chamados[0] ?? null
  },

  async update(
    id: string,
    payload: { status?: OuvidoriaStatus; idUsuarioRecebimento?: string; reply?: string },
  ): Promise<OuvidoriaEntry> {
    const response = await fetch(`${API_URL}?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    })

    const result = await handleResponse(response)
    if ("chamado" in result) {
      return result.chamado
    }
    return result.chamados[0]
  },

  async startHandling(id: string, userId: string | null | undefined) {
    if (!userId) return null
    return this.update(id, {
      status: "Em atendimento",
      idUsuarioRecebimento: userId,
    })
  },
}
