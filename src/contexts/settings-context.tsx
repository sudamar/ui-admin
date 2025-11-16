"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

import { syncLoggerWithSettings } from "@/lib/logger"
import { getSettings, updateSetting as serviceUpdateSetting, type Settings } from "@/services/settings/settings-service"

type SettingsContextValue = {
  settings: Settings | null
  loading: boolean
  refresh: () => Promise<void>
  updateSetting: (key: string, value: unknown) => Promise<void>
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSettings()
      setSettings(data)
      syncLoggerWithSettings(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const updateSetting = useCallback(
    async (key: string, value: unknown) => {
      await serviceUpdateSetting(key, value)
      await refresh()
    },
    [refresh],
  )

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        refresh,
        updateSetting,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettingsContext deve ser usado dentro de SettingsProvider")
  }
  return context
}
