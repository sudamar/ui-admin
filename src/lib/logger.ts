type LoggerSettings = {
  log_ativo?: boolean | null
}

declare global {
  interface Window {
    __FAFIH_LOGS_ATIVOS__?: boolean
  }
}

const parseBooleanEnv = (value: string | undefined) => {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  return normalized === "true" || normalized === "1" || normalized === "on"
}

const resolveInitialState = () => {
  if (typeof window !== "undefined" && typeof window.__FAFIH_LOGS_ATIVOS__ === "boolean") {
    return window.__FAFIH_LOGS_ATIVOS__
  }

  const serverValue = parseBooleanEnv(process.env.LOG_ATIVO)
  if (serverValue !== undefined) {
    return serverValue
  }

  const clientValue = parseBooleanEnv(process.env.NEXT_PUBLIC_LOG_ATIVO)
  if (clientValue !== undefined) {
    return clientValue
  }

  return process.env.NODE_ENV !== "production"
}

let logsEnabled = resolveInitialState()

const persistState = (enabled: boolean) => {
  logsEnabled = enabled
  if (typeof window !== "undefined") {
    window.__FAFIH_LOGS_ATIVOS__ = enabled
  }
}

export const configureLogger = (enabled: boolean) => {
  persistState(enabled)
}

export const syncLoggerWithSettings = (settings?: LoggerSettings | null) => {
  if (typeof settings?.log_ativo === "boolean") {
    persistState(settings.log_ativo)
  }
}

export const imprimeLogs = (...messages: unknown[]) => {
  if (!logsEnabled) return
  console.log(...messages)
}

