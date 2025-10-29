import professoresJson from "@/data/professores/professores.json"

import type { Professor } from "./types"

export function getProfessores(): Professor[] {
  return professoresJson.map((professor, index) => ({
    id: index + 1,
    nome: professor.nome ?? "",
    titulacao: professor.titulacao ?? "",
    descricao: professor.descricao ?? "",
    foto: professor.foto ?? "",
    email: professor.email ?? "",
    telefone: professor.telefone ?? "",
  }))
}
