import type { Professor } from "./types"

export const PROFESSORES_STORAGE_KEY = "ui-admin-professores-overrides"

type ProfessorOverrides = Record<number, Professor>

function isBrowser() {
  return typeof window !== "undefined"
}

export function readProfessorOverrides(): ProfessorOverrides {
  if (!isBrowser()) {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(PROFESSORES_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ProfessorOverrides
    return parsed ?? {}
  } catch (error) {
    console.error("Erro ao ler professores do storage:", error)
    return {}
  }
}

export function writeProfessorOverride(professor: Professor) {
  if (!isBrowser()) return

  try {
    const overrides = readProfessorOverrides()
    overrides[professor.id] = professor
    window.localStorage.setItem(
      PROFESSORES_STORAGE_KEY,
      JSON.stringify(overrides)
    )
  } catch (error) {
    console.error("Erro ao salvar professor no storage:", error)
  }
}

export function removeProfessorOverride(id: number) {
  if (!isBrowser()) return

  try {
    const overrides = readProfessorOverrides()
    if (overrides[id]) {
      delete overrides[id]
      window.localStorage.setItem(
        PROFESSORES_STORAGE_KEY,
        JSON.stringify(overrides)
      )
    }
  } catch (error) {
    console.error("Erro ao remover professor do storage:", error)
  }
}

export function mergeWithOverrides(
  base: Professor[],
  overrides: ProfessorOverrides
): Professor[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    return base
  }

  return base.map((professor) =>
    overrides[professor.id] ? overrides[professor.id] : professor
  )
}
