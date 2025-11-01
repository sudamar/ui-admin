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
import { professoresService } from "@/services/professores/professores-service"

type ProfessorFormProps = {
  professorId?: string
}

const emptyProfessor: Professor = {
  id: "",
  nome: "",
  titulacao: "",
  descricao: "",
  foto: "",
  email: "",
  telefone: "",
  linkProfessor: "",
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "")

  if (digits.length === 0) {
    return ""
  }

  if (digits.length <= 2) {
    return `(${digits}`
  }

  const ddd = digits.slice(0, 2)
  const isMobile = digits.length > 10
  const firstPart = digits.slice(2, isMobile ? 7 : 6)
  const lastPart = digits.slice(isMobile ? 7 : 6, isMobile ? 11 : 10)

  let result = `(${ddd}`
  result += ") "
  result += firstPart

  if (lastPart) {
    result += `-${lastPart}`
  }

  return result.trim()
}

export function ProfessorForm({ professorId }: ProfessorFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Professor>({ ...emptyProfessor })
  const [loading, setLoading] = useState(!!professorId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!professorId) {
      setFormData({ ...emptyProfessor })
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const professor = await professoresService.getById(professorId)
        if (!professor) {
          toast.error("Professor não encontrado.")
          router.push("/dashboard/professores")
          return
        }
        setFormData({
          ...professor,
          telefone: professor.telefone ? formatPhoneNumber(professor.telefone) : "",
        })
      } catch (error) {
        console.error("Erro ao carregar professor:", error)
        toast.error("Não foi possível carregar os dados do professor.")
        router.push("/dashboard/professores")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [professorId, router])

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
    if (!formData) return
    setIsSubmitting(true)
    try {
      if (professorId) {
        await professoresService.update(professorId, {
          nome: formData.nome,
          titulacao: formData.titulacao,
          descricao: formData.descricao,
          foto: formData.foto,
          email: formData.email,
          telefone: formData.telefone,
          linkProfessor: formData.linkProfessor,
        })
        toast.success("Dados do professor atualizados com sucesso!")
      } else {
        await professoresService.create({
          nome: formData.nome,
          titulacao: formData.titulacao,
          descricao: formData.descricao,
          foto: formData.foto,
          email: formData.email,
          telefone: formData.telefone,
          linkProfessor: formData.linkProfessor,
        })
        toast.success("Professor cadastrado com sucesso!")
      }
      router.push("/dashboard/professores")
      router.refresh()
    } catch (error) {
      console.error("Erro ao salvar professor:", error)
      toast.error("Não foi possível salvar as alterações. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !formData) {
    return (
      <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
        Carregando dados do professor...
      </div>
    )
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
              value={formData.titulacao ?? ""}
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
              value={formData.email ?? ""}
              onChange={(event) => handleChange("email", event.target.value)}
              placeholder="nome@exemplo.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              inputMode="tel"
              value={formData.telefone ?? ""}
              onChange={(event) => handleChange("telefone", formatPhoneNumber(event.target.value))}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="linkProfessor">Link do professor</Label>
            <Input
              id="linkProfessor"
              type="url"
              value={formData.linkProfessor ?? ""}
              onChange={(event) => handleChange("linkProfessor", event.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
            <p className="text-xs text-muted-foreground">
              Informe um link público do professor (LinkedIn, currículo, site pessoal, etc.).
            </p>
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
            value={formData.descricao ?? ""}
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
