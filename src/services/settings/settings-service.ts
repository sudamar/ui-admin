
export interface Settings {
  id: number
  nome_site: string
  manutencao: boolean
  drmsocial: boolean
  log_ativo: boolean
  email_ouvidoria?: string
  [key: string]: any
}

export const getSettings = async (): Promise<Settings | null> => {
  const response = await fetch("/api/settings")
  if (!response.ok) {
    throw new Error("Failed to fetch settings")
  }
  return response.json()
}

export const updateSetting = async (key: string, value: unknown): Promise<Settings | null> => {
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key, value }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to update setting: ${errorText}`)
  }

  return response.json()
}
