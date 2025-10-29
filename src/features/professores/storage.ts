import type { Professor } from "./types"

export const PROFESSORES_STORAGE_KEY = "ui-admin-professores-overrides"

type ProfessorOverrides = Record<number, Professor | null>

function isBrowser() {
  return typeof window !== "undefined"
}

function readOverridesFromStorage(): ProfessorOverrides {
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

export function readProfessorOverrides(): ProfessorOverrides {
  return readOverridesFromStorage()
}

export function writeProfessorOverride(professor: Professor) {
  if (!isBrowser()) return

  try {
    const overrides = readOverridesFromStorage()
    overrides[professor.id] = professor
    window.localStorage.setItem(
      PROFESSORES_STORAGE_KEY,
      JSON.stringify(overrides)
    )
  } catch (error) {
    console.error("Erro ao salvar professor no storage:", error)
  }
}

export function markProfessorDeleted(id: number) {
  if (!isBrowser()) return

  try {
    const overrides = readOverridesFromStorage()
    overrides[id] = null
    window.localStorage.setItem(
      PROFESSORES_STORAGE_KEY,
      JSON.stringify(overrides)
    )
  } catch (error) {
    console.error("Erro ao marcar professor como removido no storage:", error)
  }
}

export function mergeWithOverrides(
  base: Professor[],
  overrides: ProfessorOverrides
): Professor[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    return base
  }

  const baseById = new Map(base.map((professor) => [professor.id, professor]))
  const result: Professor[] = []

  for (const professor of base) {
    const override = overrides[professor.id]
    if (override === null) {
      continue
    }
    result.push(override ?? professor)
  }

  for (const [idString, override] of Object.entries(overrides)) {
    const id = Number(idString)
    if (!Number.isFinite(id)) continue
    if (baseById.has(id)) continue
    if (override) {
      result.push(override)
    }
  }

  return result
}
