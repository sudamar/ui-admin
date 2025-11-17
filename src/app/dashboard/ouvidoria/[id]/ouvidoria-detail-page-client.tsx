"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Loader2, Mail, Share2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RichTextEditorHybrid } from "@/components/shared/rich-text-editor-hybrid"
import { ouvidoriaService, type OuvidoriaEntry } from "@/services/ouvidoria/ouvidoria-service"
import { useAuth } from "@/contexts/auth-context"

type Props = {
  chamadoId: string
  acao?: string
}

const statusStyles: Record<string, string> = {
  Enviado: "bg-slate-100 text-slate-700 border-slate-200",
  "Em atendimento": "bg-amber-100 text-amber-800 border-amber-200",
  Finalizado: "bg-emerald-100 text-emerald-800 border-emerald-200",
}

export function OuvidoriaDetailPageClient({ chamadoId, acao }: Props) {
  const router = useRouter()
  const { user } = useAuth()

  const [chamado, setChamado] = useState<OuvidoriaEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [reply, setReply] = useState("")
  const [savingReply, setSavingReply] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const entry = await ouvidoriaService.getById(chamadoId)
        if (!entry) {
          setError("Chamado não encontrado.")
          return
        }
        setChamado(entry)
      } catch (err) {
        console.error("Erro ao carregar chamado", err)
        setError(err instanceof Error ? err.message : "Não foi possível carregar o chamado.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [chamadoId])

  useEffect(() => {
    const assign = async () => {
      if (!chamado || chamado.status !== "Enviado" || !user?.id || isAssigning) return
      try {
        setIsAssigning(true)
        const updated = await ouvidoriaService.startHandling(chamado.id, user.id)
        if (updated) {
          setChamado(updated)
        }
      } catch (err) {
        console.error("Erro ao atualizar status da ouvidoria", err)
      } finally {
        setIsAssigning(false)
      }
    }

    void assign()
  }, [chamado, user?.id, isAssigning])

  useEffect(() => {
    if (chamado) {
      setReply(chamado.reply ?? "")
    }
  }, [chamado?.id])

  const selectedActionLabel = useMemo(() => {
    if (acao === "encaminhar") return "Encaminhar"
    if (acao === "responder") return "Responder"
    return null
  }, [acao])

  const handleReply = () => {
    if (!chamado?.email) {
      toast.error("Esse chamado não possui um e-mail para resposta.")
      return
    }
    const subject = encodeURIComponent(`Ouvidoria FAFIH - ${chamado.assunto}`)
    const body = encodeURIComponent(`Olá ${chamado.nomeCompleto ?? ""},%0D%0A%0D%0A${chamado.mensagem}%0D%0A%0D%0AResposta:%0D%0A`)
    window.location.href = `mailto:${chamado.email}?subject=${subject}&body=${body}`
  }

  const handleForward = async () => {
    if (!chamado) return
    try {
      const resumo = [
        `Assunto: ${chamado.assunto}`,
        `Manifestação: ${chamado.tipoManifestacao}`,
        `Nome: ${chamado.nomeCompleto ?? "Anônimo"}`,
        `E-mail: ${chamado.email ?? "Não informado"}`,
        `Telefone: ${chamado.telefone ?? "Não informado"}`,
        "",
        chamado.mensagem,
      ].join("\n")
      await navigator.clipboard.writeText(resumo)
      toast.success("Detalhes copiados para encaminhamento.")
    } catch {
      toast.error("Não foi possível copiar os detalhes.")
    }
  }

  const handleSaveReply = async () => {
    if (!chamado) return
    try {
      setSavingReply(true)
      const updated = await ouvidoriaService.update(chamado.id, { reply })
      setChamado(updated)
      setReply(updated.reply ?? "")
      toast.success("Resposta registrada com sucesso!")
    } catch (err) {
      console.error("Erro ao salvar resposta", err)
      const message = err instanceof Error ? err.message : "Não foi possível salvar a resposta."
      toast.error(message)
    } finally {
      setSavingReply(false)
    }
  }

  const replyChanged = chamado ? (chamado.reply ?? "") !== reply : false
  const canSaveReply = reply.trim().length > 0 && replyChanged

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <p className="mt-2 text-sm">Carregando informações da manifestação...</p>
      </div>
    )
  }

  if (error || !chamado) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chamado de ouvidoria</CardTitle>
          <CardDescription>Não foi possível carregar os dados solicitados.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error ?? "Chamado não encontrado."}</p>
          <Button type="button" className="mt-4" onClick={() => router.push("/dashboard/ouvidoria")}>
            Voltar para lista
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Button
        asChild
        variant="ghost"
        className="inline-flex w-full items-center justify-center gap-2 border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/80 sm:w-auto"
      >
        <Link href="/dashboard/ouvidoria">
          <ArrowLeft className="h-4 w-4" />
          Voltar para listagem
        </Link>
      </Button>

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold">{chamado.assunto}</CardTitle>
              <CardDescription>
                Manifestação - {chamado.tipoManifestacao} • Enviado em{" "}
                {chamado.createdAt ? format(new Date(chamado.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}
              </CardDescription>
            </div>
            <Badge variant="outline" className={`border ${statusStyles[chamado.status] ?? "border-slate-200"}`}>
              {chamado.status}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Recebido por:</span>{" "}
            {chamado.responsavelNome ?? "Aguardando responsável"}
          </div>
          {selectedActionLabel ? (
            <p className="text-xs font-medium uppercase text-muted-foreground tracking-wide">
              Modo selecionado: {selectedActionLabel}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Identificação</p>
              <p className="mt-1 text-sm text-foreground">
                {chamado.nomeCompleto ?? (chamado.identificacaoTipo === "anonimo" ? "Solicitante anônimo" : "Não informado")}
              </p>
              <p className="text-xs text-muted-foreground">Tipo: {chamado.identificacaoTipo}</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Contato</p>
              <p className="mt-1 text-sm text-foreground">{chamado.email ?? "Sem e-mail informado"}</p>
              <p className="text-xs text-muted-foreground">{chamado.telefone ?? "Sem telefone"}</p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase">Vínculo</p>
              <p className="mt-1 text-sm text-foreground">{chamado.vinculo ?? "Não informado"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleReply} disabled={!chamado.email}>
              <Mail className="mr-2 h-4 w-4" />
              Responder por e-mail
            </Button>
            <Button type="button" variant="secondary" onClick={() => void handleForward()}>
              <Share2 className="mr-2 h-4 w-4" />
              Copiar para encaminhar
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium text-muted-foreground">Mensagem enviada</p>
            <p className="mt-2 text-base leading-relaxed text-foreground whitespace-pre-wrap">{chamado.mensagem}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Responder manifestação</CardTitle>
              <CardDescription>Use o editor abaixo para registrar a resposta que será enviada ao solicitante.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditorHybrid value={reply} onChange={setReply} placeholder="Escreva a resposta para o solicitante..." />
              {chamado.reply ? (
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resposta registrada</p>
                  <div
                    className="prose prose-sm mt-2 max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: chamado.reply }}
                  />
                </div>
              ) : null}
            </CardContent>
            <div className="flex items-center gap-3 border-t bg-muted/30 px-6 py-4">
              <Button type="button" onClick={() => void handleSaveReply()} disabled={!canSaveReply || savingReply}>
                {savingReply ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar resposta
              </Button>
              {!chamado.reply ? (
                <p className="text-xs text-muted-foreground">
                  A resposta também será enviada por e-mail se o solicitante se identificou.
                </p>
              ) : null}
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
