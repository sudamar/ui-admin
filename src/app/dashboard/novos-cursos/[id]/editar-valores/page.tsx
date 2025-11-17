"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Wallet, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HeaderEdicaoCursos } from "@/features/novos-cursos/components/header-edicao-cursos"
import { cursosService, type Curso } from "@/services/cursos/cursos-service"
import { toast } from "sonner"

const normalizeCurrency = (value: string) => {
  const onlyDigits = value.replace(/[^\d]/g, "")
  if (!onlyDigits) return ""
  const number = Number(onlyDigits) / 100
  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })
}

const parseCurrencyToNumber = (value: string): number | null => {
  const normalized = value.replace(/[^\d,-]+/g, "").replace(".", "").replace(",", ".")
  if (!normalized) return null
  const numeric = Number(normalized)
  return Number.isNaN(numeric) ? null : numeric
}

const formatCurrencyFromStored = (value: string | null | undefined) => {
  if (!value) return ""
  const numeric = parseCurrencyToNumber(value)
  if (numeric === null) return ""
  return numeric.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })
}

const mapAlertValueToOption = (value: string) => {
  if (value === "14") return "poucas"
  if (value === "5") return "ultimas"
  if (value === "0") return "esgotado"
  return "normal"
}

export default function EditarValoresPage() {
  const params = useParams<{ id: string }>()
  const courseSlugOrId = params?.id
  const router = useRouter()

  const [course, setCourse] = useState<Curso | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [price, setPrice] = useState("")
  const [originalPrice, setOriginalPrice] = useState("")
  const [precoMatricula, setPrecoMatricula] = useState("")
  const [monthlyPrice, setMonthlyPrice] = useState("")
  const [startDate, setStartDate] = useState("")
  const [duration, setDuration] = useState("")
  const [workload, setWorkload] = useState("")
  const [alertaVagas, setAlertaVagas] = useState("")

  useEffect(() => {
    if (!courseSlugOrId) return

    const load = async () => {
      try {
        setLoading(true)
        let data = await cursosService.getById(courseSlugOrId)
        if (!data) {
          data = await cursosService.getBySlug(courseSlugOrId)
        }
        if (data) {
          setCourse(data)
          setPrice(data.price != null ? normalizeCurrency(data.price.toFixed(2)) : "")
          setOriginalPrice(data.originalPrice != null ? normalizeCurrency(data.originalPrice.toFixed(2)) : "")
          setPrecoMatricula(data.precoMatricula != null ? normalizeCurrency(data.precoMatricula.toFixed(2)) : "")
          setMonthlyPrice(formatCurrencyFromStored(data.monthlyPrice))
          setStartDate(data.startDate ?? "")
          setDuration(data.duration ?? "")
          setWorkload(data.workload ?? "")
          setAlertaVagas((data.alertaVagas ?? (data as any).alerta_vagas ?? "").toString())
        }
      } catch (error) {
        console.error("Erro ao carregar curso", error)
        toast.error("Não foi possível carregar os valores do curso.")
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [courseSlugOrId])

  const sanitizedState = useMemo(
    () => ({
      price: parseCurrencyToNumber(price),
      originalPrice: parseCurrencyToNumber(originalPrice),
      precoMatricula: parseCurrencyToNumber(precoMatricula),
      monthlyPrice: monthlyPrice.trim(),
      startDate: startDate.trim(),
      duration: duration.trim(),
      workload: workload.trim(),
      alertaVagas: alertaVagas.trim(),
    }),
    [price, originalPrice, precoMatricula, monthlyPrice, startDate, duration, workload, alertaVagas],
  )

  const isDirty = useMemo(() => {
    if (!course) return false
    const alertaOriginal = (course.alertaVagas ?? (course as any).alerta_vagas ?? "").toString()
    return (
      sanitizedState.price !== (course.price ?? null) ||
      sanitizedState.originalPrice !== (course.originalPrice ?? null) ||
      sanitizedState.precoMatricula !== (course.precoMatricula ?? null) ||
      sanitizedState.monthlyPrice !== (course.monthlyPrice ?? "") ||
      sanitizedState.startDate !== (course.startDate ?? "") ||
      sanitizedState.duration !== (course.duration ?? "") ||
      sanitizedState.workload !== (course.workload ?? "") ||
      sanitizedState.alertaVagas !== alertaOriginal
    )
  }, [course, sanitizedState])

  const handleSave = useCallback(async () => {
    if (!course) return

    try {
      setSaving(true)
      const alertaValue = sanitizedState.alertaVagas ? Number(sanitizedState.alertaVagas) : null
      if (alertaValue != null && Number.isNaN(alertaValue)) {
        toast.error("Informe um número válido para alerta de vagas.")
        setSaving(false)
        return
      }
      const payload: Curso = {
        ...course,
        price: sanitizedState.price ?? undefined,
        originalPrice: sanitizedState.originalPrice ?? undefined,
        precoMatricula: sanitizedState.precoMatricula ?? undefined,
        monthlyPrice: sanitizedState.monthlyPrice || undefined,
        startDate: sanitizedState.startDate || undefined,
        duration: sanitizedState.duration || undefined,
        workload: sanitizedState.workload || undefined,
        alertaVagas: alertaValue ?? undefined,
      }

      const updated = await cursosService.update(course.id, payload)
      setCourse(updated)
      setPrice(updated.price != null ? normalizeCurrency(updated.price.toFixed(2)) : "")
      setOriginalPrice(updated.originalPrice != null ? normalizeCurrency(updated.originalPrice.toFixed(2)) : "")
      setPrecoMatricula(updated.precoMatricula != null ? normalizeCurrency(updated.precoMatricula.toFixed(2)) : "")
      setMonthlyPrice(formatCurrencyFromStored(updated.monthlyPrice))
      setStartDate(updated.startDate ?? "")
      setDuration(updated.duration ?? "")
      setWorkload(updated.workload ?? "")
      setAlertaVagas(((updated.alertaVagas ?? (updated as any).alerta_vagas) ?? "").toString())
      toast.success("Valores atualizados com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar valores", error)
      const message = error instanceof Error ? error.message : "Não foi possível atualizar os valores."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }, [course, sanitizedState])

  const handleCancel = useCallback(() => {
    if (isDirty && !window.confirm("Existem alterações não salvas. Deseja descartar e voltar?")) {
      return
    }
    router.push("/dashboard/novos-cursos")
  }, [isDirty, router])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault()
        event.stopPropagation()
        void handleSave()
        return
      }
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        handleCancel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave, handleCancel])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="rounded-md border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
        Curso não encontrado.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {saving ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Salvando valores...</p>
        </div>
      ) : null}

      <Button
        asChild
        variant="ghost"
        className="inline-flex w-full items-center justify-center gap-2 border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/80 sm:w-auto"
      >
        <Link href="/dashboard/novos-cursos">
          <ArrowLeft className="h-4 w-4" />
          Voltar para lista de novos cursos
        </Link>
      </Button>

      <HeaderEdicaoCursos
        title={course.title}
        category={course.categoryLabel ?? course.category ?? "Não informado"}
        imageUrl={course.image_folder ?? course.imageUrl ?? null}
      />

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Valores e investimentos</CardTitle>
              <p className="text-sm text-muted-foreground">
                Atualize preços, datas e informações financeiras do curso.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Valor atual</Label>
              <Input
                id="price"
                value={price}
                onChange={(event) => setPrice(normalizeCurrency(event.target.value))}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originalPrice">Valor original</Label>
              <Input
                id="originalPrice"
                value={originalPrice}
                onChange={(event) => setOriginalPrice(normalizeCurrency(event.target.value))}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precoMatricula">Valor da matrícula</Label>
              <Input
                id="precoMatricula"
                value={precoMatricula}
                onChange={(event) => setPrecoMatricula(normalizeCurrency(event.target.value))}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">Valor da parcela</Label>
              <Input
                id="monthlyPrice"
                value={monthlyPrice}
                onChange={(event) => setMonthlyPrice(normalizeCurrency(event.target.value))}
                placeholder="R$ 0,00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de início</Label>
              <Input
                id="startDate"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                placeholder="Abril/2025"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="18 meses"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workload">Carga horária</Label>
              <Input
                id="workload"
                value={workload}
                onChange={(event) => setWorkload(event.target.value)}
                placeholder="360 horas"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="alertaVagas">Alerta de vagas</Label>
              <Select
                value={mapAlertValueToOption(alertaVagas)}
                onValueChange={(value) => {
                  if (value === "poucas") {
                    setAlertaVagas("14")
                    return
                  }
                  if (value === "ultimas") {
                    setAlertaVagas("5")
                    return
                  }
                  if (value === "esgotado") {
                    setAlertaVagas("0")
                    return
                  }
                  setAlertaVagas("50")
                }}
              >
                <SelectTrigger id="alertaVagas" className="h-9">
                  <SelectValue placeholder="Selecione o alerta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="poucas">Restam poucas vagas</SelectItem>
                  <SelectItem value="ultimas">Últimas vagas</SelectItem>
                  <SelectItem value="esgotado">Vagas esgotadas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Mensagens automáticas são exibidas conforme o limite escolhido. Ajuste conforme seu ritmo de matrícula.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" type="button" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={!isDirty || saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
              </>
            ) : (
              "Salvar valores"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
