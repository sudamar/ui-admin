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

import type { MembroAnalista } from "../types"
import { membrosAnalistasService } from "@/services/membros-analistas/membros-analistas-service"

type MembroAnalistaFormProps = {
  membroId?: string
}

const emptyMembro: MembroAnalista = {
  id: "",
  nome: "",
  tipo: "",
  atendimento: "",
  cidade: "",
  estado: "",
  descricao: "",
  telefone: "",
  email: "",
  foto: "",
  linkMembro: "",
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

export function MembroAnalistaForm({ membroId }: MembroAnalistaFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<MembroAnalista>({ ...emptyMembro })
  const [loading, setLoading] = useState(!!membroId)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!membroId) {
      setFormData({ ...emptyMembro })
      setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      try {
        const membro = await membrosAnalistasService.getById(membroId)
        if (!membro) {
          toast.error("Membro analista não encontrado.")
          router.push("/dashboard/membros-analistas")
          return
        }
        setFormData({
          ...membro,
          telefone: membro.telefone ? formatPhoneNumber(membro.telefone) : "",
          estado: membro.estado ?? "",
          cidade: membro.cidade ?? "",
          descricao: membro.descricao ?? "",
          email: membro.email ?? "",
          foto: membro.foto ?? "",
          linkMembro: membro.linkMembro ?? "",
        })
      } catch (error) {
        console.error("Erro ao carregar membro analista:", error)
        toast.error("Não foi possível carregar os dados do membro analista.")
        router.push("/dashboard/membros-analistas")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [membroId, router])

  const handleChange = (field: keyof MembroAnalista, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    const payload = {
      nome: formData.nome,
      tipo: formData.tipo,
      atendimento: formData.atendimento,
      cidade: formData.cidade,
      estado: formData.estado,
      descricao: formData.descricao,
      telefone: formData.telefone,
      email: formData.email,
      foto: formData.foto,
      linkMembro: formData.linkMembro,
    }

    try {
      if (membroId) {
        await membrosAnalistasService.update(membroId, payload)
        toast.success("Dados do membro analista atualizados com sucesso!")
      } else {
        await membrosAnalistasService.create(payload)
        toast.success("Membro analista cadastrado com sucesso!")
      }
      router.push("/dashboard/membros-analistas")
      router.refresh()
    } catch (error) {
      console.error("Erro ao salvar membro analista:", error)
      toast.error("Não foi possível salvar as alterações. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-md border border-dashed border-muted-foreground/30 p-6 text-center text-sm text-muted-foreground">
        Carregando dados do membro analista...
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
          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Input
                id="tipo"
                value={formData.tipo}
                onChange={(event) => handleChange("tipo", event.target.value)}
                placeholder="Ex.: Psicólogo, Assistente Social..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="atendimento">Atendimento</Label>
              <Input
                id="atendimento"
                value={formData.atendimento}
                onChange={(event) =>
                  handleChange("atendimento", event.target.value)
                }
                placeholder="Ex.: Presencial, On-line..."
                required
              />
            </div>
          </div>
          <ImageUpload
            label="Foto do membro analista"
            description="Selecione uma imagem para representar o membro analista."
            value={formData.foto || undefined}
            onChange={(value) => handleChange("foto", value ?? "")}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contato e localização</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              inputMode="tel"
              value={formData.telefone ?? ""}
              onChange={(event) =>
                handleChange("telefone", formatPhoneNumber(event.target.value))
              }
              placeholder="(00) 00000-0000"
              maxLength={15}
            />
          </div>
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
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              value={formData.cidade ?? ""}
              onChange={(event) => handleChange("cidade", event.target.value)}
              placeholder="Ex.: Caratinga"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="estado">Estado (UF)</Label>
            <Input
              id="estado"
              value={(formData.estado ?? "").toUpperCase()}
              onChange={(event) =>
                handleChange(
                  "estado",
                  event.target.value.toUpperCase().slice(0, 2),
                )
              }
              placeholder="Ex.: MG"
              maxLength={2}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="linkMembro">Link do membro</Label>
            <Input
              id="linkMembro"
              type="url"
              value={formData.linkMembro ?? ""}
              onChange={(event) => handleChange("linkMembro", event.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground">
              Informe um link público do membro (site, rede social, currículo etc.).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Descrição</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Label htmlFor="descricao">Resumo do membro</Label>
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
