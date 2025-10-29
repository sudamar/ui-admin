'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/ui/image-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import type { Professor } from "../types"
import { readProfessorOverrides, writeProfessorOverride } from "../storage"

type EditProfessorFormProps = {
  professor: Professor
}

export function EditProfessorForm({ professor }: EditProfessorFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Professor>(professor)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const overrides = readProfessorOverrides()
    if (overrides[professor.id]) {
      setFormData(overrides[professor.id])
    }
  }, [professor.id])

  const handleChange = (
    field: keyof Professor,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      // Aqui faria a chamada para salvar no backend.
      await new Promise((resolve) => setTimeout(resolve, 400))
      writeProfessorOverride(formData)
      toast.success("Dados do professor atualizados com sucesso!")
      router.push("/dashboard/professores")
      router.refresh()
    } catch (error) {
      console.error("Erro ao salvar professor:", error)
      toast.error("Não foi possível salvar as alterações. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(event) => handleChange("nome", event.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="titulacao">Titulação</Label>
            <Input
              id="titulacao"
              value={formData.titulacao}
              onChange={(event) => handleChange("titulacao", event.target.value)}
            />
          </div>
          <ImageUpload
            label="Foto do professor"
            description="Selecione uma imagem para representar o professor."
            value={formData.foto || undefined}
            onChange={(value) => handleChange("foto", value ?? "")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="nome@exemplo.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(event) => handleChange("telefone", event.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descrição</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Label htmlFor="descricao">Resumo profissional</Label>
          <Textarea
            id="descricao"
            value={formData.descricao}
            onChange={(event) => handleChange("descricao", event.target.value)}
            rows={6}
          />
        </CardContent>
      </Card>

      <Card>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
