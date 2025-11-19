#!/usr/bin/env node

import { createClient } from "@supabase/supabase-js"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, "..")

async function loadEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, "utf8")
    const lines = content.split(/\r?\n/)
    for (const rawLine of lines) {
      const line = rawLine.trim()
      if (!line || line.startsWith("#")) continue
      const eqIndex = line.indexOf("=")
      if (eqIndex === -1) continue
      const key = line.slice(0, eqIndex).trim()
      if (!key || process.env[key]) continue
      let value = line.slice(eqIndex + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`[backup] Não foi possível ler ${filePath}: ${error.message}`)
    }
  }
}

async function loadEnvFiles() {
  const envCandidates = [
    path.join(projectRoot, ".env"),
    path.join(projectRoot, ".env.local"),
  ]
  for (const envPath of envCandidates) {
    await loadEnvFile(envPath)
  }
}

async function fetchTableNames(client) {
  try {
    const { data, error } = await client
      .schema("information_schema")
      .from("tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_type", "BASE TABLE")
      .order("table_name", { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? [])
      .map((row) => row.table_name)
      .filter((name) => typeof name === "string" && name.length > 0)
  } catch (error) {
    console.warn(`[backup] Não foi possível listar as tabelas automaticamente: ${error.message}`)
    return []
  }
}

const FALLBACK_TABLES = [
  "usuarios",
  "usuarios_detalhes",
  "posts",
  "cursos",
  "settings",
  "ouvidoria",
  "trabalhos",
  "trabalho_categorizados",
  "categorias_trabalhos",
  "polos",
  "professores",
  "membros_analistas",
]

async function fetchAllRows(client, tableName) {
  const pageSize = 1000
  const rows = []
  let from = 0

  while (true) {
    const to = from + pageSize - 1
    const { data, error } = await client.from(tableName).select("*").range(from, to)

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      break
    }

    rows.push(...data)
    if (data.length < pageSize) {
      break
    }
    from += pageSize
  }

  return rows
}

async function main() {
  await loadEnvFiles()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "[backup] Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_KEY antes de executar o script.",
    )
    process.exitCode = 1
    return
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  console.log("[backup] Listando tabelas públicas...")
  let tableNames = await fetchTableNames(supabaseAdmin)
  if (!tableNames.length) {
    console.warn("[backup] Nenhuma tabela pública encontrada automaticamente. Usando lista manual.")
    tableNames = FALLBACK_TABLES
  }
  tableNames = Array.from(new Set(tableNames))

  const backupPayload = {
    generatedAt: new Date().toISOString(),
    tables: {},
  }

  for (const tableName of tableNames) {
    console.log(`[backup] Exportando ${tableName}...`)
    try {
      const rows = await fetchAllRows(supabaseAdmin, tableName)
      backupPayload.tables[tableName] = rows
    } catch (error) {
      console.warn(`[backup] Falha ao exportar ${tableName}: ${error.message}`)
    }
  }

  const backupDir = path.join(projectRoot, "backup")
  await fs.mkdir(backupDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`)
  await fs.writeFile(backupFile, JSON.stringify(backupPayload, null, 2), "utf8")

  console.log(`[backup] Backup concluído com sucesso em ${backupFile}`)
}

main().catch((error) => {
  console.error("[backup] Erro ao gerar backup:", error)
  process.exitCode = 1
})
