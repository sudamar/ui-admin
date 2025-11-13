"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import MultipleSelector, { type Option } from "@/components/ui/multiselect"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { ArrowLeft, Save, Tag, CheckCircle, XCircle, type LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"

import { trabalhosService, type Trabalho } from "@/services/trabalhos/trabalhos-service"
import { categoriasService, type Categoria } from "@/services/trabalhos/categorias-service"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/

const getCategoryIcon = (icon?: string): LucideIcon => {
  if (!icon) return Tag
  const IconComponent = Icons[icon as keyof typeof Icons] as LucideIcon | undefined
  return IconComponent ?? Tag
}

const extrairNomeArquivo = (valor?: string) => {
  if (!valor) return ""
  if (valor.startsWith("data:application/pdf")) {
    return "PDF incorporado"
  }
  const partes = valor.split("/")
  return partes[partes.length - 1]
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")

const mapCategorias = (categorias: Categoria[]) => {
  const entries: Array<[string, Categoria]> = []
  categorias.forEach((categoria) => {
    const slugFromName = slugify(categoria.nome)
    const slugOriginal = categoria.slug?.trim() || slugFromName
    entries.push([categoria.id, categoria])
    entries.push([categoria.nome, categoria])
    entries.push([slugOriginal, categoria])
    entries.push([slugFromName, categoria])
  })
  return new Map(entries)
}

const normalizeHexColor = (input?: string | null): string | null => {
  if (!input) return null
  const trimmed = input.trim()
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return null
  }
  if (trimmed.length === 4) {
    const r = trimmed.charAt(1)
    const g = trimmed.charAt(2)
    const b = trimmed.charAt(3)
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
  }
  return trimmed.toUpperCase()
}

const getTextColorForBackground = (hexColor: string): string => {
  const r = Number.parseInt(hexColor.slice(1, 3), 16)
  const g = Number.parseInt(hexColor.slice(3, 5), 16)
  const b = Number.parseInt(hexColor.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? "#111827" : "#F9FAFB"
}

const getBadgeAppearance = (categoria?: Categoria) => {
  const normalizedColor = normalizeHexColor(categoria?.cor ?? null)
  if (!normalizedColor) {
    return {
      className: "border-border bg-muted text-muted-foreground",
      style: undefined as CSSProperties | undefined,
    }
  }
  return {
    className: "border-transparent text-inherit shadow-sm",
    style: {
      backgroundColor: normalizedColor,
      borderColor: normalizedColor,
      color: getTextColorForBackground(normalizedColor),
    } satisfies CSSProperties,
  }
}

const trabalhoSchema = z.object({
  titulo: z.string().min(3, "Informe um título"),
  autor: z.string().min(3, "Informe o autor"),
  data_publicacao: z.string().min(1, "Informe a data"),
  link: z.string().url("Informe uma URL válida"),
  tags: z.array(z.string()).min(1, "Selecione ao menos uma tag"),
  resumo: z.string().optional(),
  arquivo: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || value.startsWith("data:application/pdf"),
      "Envie um arquivo PDF",
    ),
  nota: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) return true
      const normalized = value.replace(",", ".")
      const parsed = Number.parseFloat(normalized)
      return !Number.isNaN(parsed) && parsed >= 0 && parsed <= 999
    }, "Informe uma nota entre 0 e 999,99"),
  visitantes: z.string().optional(),
  baixados: z.string().optional(),
})

type TrabalhoFormValues = z.infer<typeof trabalhoSchema>

export default function EditTrabalhoPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pdfName, setPdfName] = useState<string>("")
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriasLoading, setCategoriasLoading] = useState(true)
  const [trabalhoId, setTrabalhoId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<{ visitantes: number; baixados: number | null }>({
    visitantes: 0,
    baixados: null,
  })

  const form = useForm<TrabalhoFormValues>({
    resolver: zodResolver(trabalhoSchema),
    defaultValues: {
      titulo: "",
      autor: "",
      data_publicacao: "",
      link: "",
      tags: [],
      resumo: "",
      nota: "",
      visitantes: "",
      baixados: "",
      arquivo: "",
    },
  })

  const selectedTags = form.watch("tags") ?? []

  const categoryMap = useMemo(() => mapCategorias(categorias), [categorias])

const tagOptions = useMemo<Option[]>(
  () =>
    categorias.map((categoria) => ({
      value: categoria.nome,
      label: categoria.nome,
    })),
  [categorias]
)

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "0"
  return new Intl.NumberFormat("pt-BR").format(value)
}

const getMedal = (downloads: number | null) => {
  if (!downloads || downloads <= 20) return null
  if (downloads > 100) {
    return {
      label: "Medalha de Ouro",
      image: "/assets/images/medals/gold-medal.png",
    }
  }
  if (downloads > 60) {
    return {
      label: "Medalha de Prata",
      image: "/assets/images/medals/silver-medal.png",
    }
  }
  return {
    label: "Medalha de Bronze",
    image: "/assets/images/medals/bronze-medal.png",
  }
}

const medalInfo = useMemo(() => getMedal(metrics.baixados ?? 0), [metrics.baixados])

  useEffect(() => {
    const loadDados = async () => {
      try {
        const [trabalho, categoriasLista] = await Promise.all([
          trabalhosService.getBySlug(slug),
          categoriasService.getAll(),
        ])

        setCategorias(categoriasLista)
        setCategoriasLoading(false)

        if (!trabalho) {
          router.push("/dashboard/biblioteca")
          return
        }

        const safeTags = Array.isArray(trabalho.tags) ? trabalho.tags : []

        form.reset({
          titulo: trabalho.titulo,
          autor: trabalho.autor,
          data_publicacao: trabalho.data_publicacao,
          link: trabalho.link,
          tags: safeTags,
          resumo: trabalho.resumo ?? "",
          nota: trabalho.nota?.toString() ?? "",
          visitantes: trabalho.visitantes.toString(),
          baixados: trabalho.baixados?.toString() ?? "",
          arquivo: trabalho.arquivo ?? "",
        })
        setTrabalhoId(trabalho.id)
        setMetrics({
          visitantes: trabalho.visitantes,
          baixados: trabalho.baixados ?? null,
        })
        setPdfName(trabalho.arquivo ? extrairNomeArquivo(trabalho.arquivo) : "")
      } catch (error) {
        console.error("Erro ao carregar dados", error)
      } finally {
        setCategoriasLoading(false)
        setLoading(false)
      }
    }

    void loadDados()
  }, [form, router, slug])

  const onSubmit = async (values: TrabalhoFormValues) => {
    if (!trabalhoId) {
      toast.error("Não foi possível identificar o trabalho para atualizar.", {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
      })
      return
    }

    setSaving(true)
    try {
      const notaValue = values.nota ? Number.parseFloat(values.nota.replace(",", ".")) : undefined

      const payload: Trabalho = {
        id: trabalhoId,
        titulo: values.titulo,
        autor: values.autor,
        data_publicacao: values.data_publicacao,
        link: values.link,
        tags: values.tags,
        slug,
        resumo: values.resumo,
        arquivo: values.arquivo ? values.arquivo : undefined,
        nota: notaValue,
        visitantes: metrics.visitantes,
        baixados: metrics.baixados ?? undefined,
      }

      await trabalhosService.update(trabalhoId, payload)
      toast.success("Trabalho atualizado com sucesso!", {
        icon: <CheckCircle className="h-4 w-4 text-blue-500" />,
      })
      router.push("/dashboard/biblioteca")
    } catch (error) {
      console.error("Erro ao atualizar trabalho", error)
      toast.error("Não foi possível atualizar o trabalho.", {
        icon: <XCircle className="h-4 w-4 text-red-500" />,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInvalid = () => {
    toast.error("Há campos inválidos. Verifique os destaques no formulário.", {
      icon: <XCircle className="h-4 w-4 text-red-500" />,
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">Carregando trabalho...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/biblioteca">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar trabalho</h1>
            <p className="text-muted-foreground">Atualize os dados do trabalho selecionado.</p>
          </div>
        </div>
      </div>

      <div className="w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, handleInvalid)} className="space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Dados principais</CardTitle>
                <CardDescription>Edite as informações essenciais do trabalho.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título do trabalho</FormLabel>
                      <FormControl>
                        <Input placeholder="Título completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autor</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do autor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_publicacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de publicação</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div
                  id="medal"
                  className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-border/60 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
                >
                  <span>
                    <strong className="text-foreground">{formatNumber(metrics.visitantes)}</strong> visitas
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-foreground">{formatNumber(metrics.baixados)}</strong> downloads
                  </span>
                  {medalInfo ? (
                    <span className="inline-flex items-center gap-2 font-medium text-foreground">
                      <Image
                        src={medalInfo.image}
                        alt={medalInfo.label}
                        width={20}
                        height={20}
                        className="h-5 w-5"
                      />
                      {medalInfo.label}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="w-full">
              <CardHeader>
                <CardTitle>Detalhes do trabalho</CardTitle>
                <CardDescription>Altere as demais informações conforme necessário.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">


                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://ijep.com.br/biblioteca-ijep/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arquivo"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Arquivo PDF</FormLabel>
                      <FormControl>
                        <div>
                          <Input
                            type="file"
                            accept="application/pdf"
                            onChange={(event) => {
                              const file = event.target.files?.[0]
                              if (!file) {
                                field.onChange("")
                                setPdfName("")
                                return
                              }
                              if (file.type !== "application/pdf") {
                                alert("Envie um arquivo PDF.")
                                event.target.value = ""
                                return
                              }
                              const reader = new FileReader()
                              reader.onload = () => {
                                field.onChange(reader.result as string)
                                setPdfName(file.name)
                                event.target.value = ""
                              }
                              reader.readAsDataURL(file)
                            }}
                          />
                        </div>
                      </FormControl>
                      {field.value ? (
                        <div className="flex flex-col gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs text-primary">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">PDF carregado</span>
                            <Button asChild variant="link" size="sm" className="px-0 text-primary">
                              <a href={field.value} target="_blank" rel="noreferrer">
                                Visualizar
                              </a>
                            </Button>
                          </div>
                          <span className="break-all text-muted-foreground">
                            {extrairNomeArquivo(field.value) || pdfName || "Arquivo selecionado"}
                          </span>
                        </div>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <MultipleSelector
                          value={(field.value ?? []).map((value) => ({
                            value,
                            label: categoryMap.get(value)?.nome ?? value,
                          }))}
                          onChange={(options) => field.onChange(options.map((option) => option.value))}
                          options={tagOptions}
                          placeholder={
                            categoriasLoading ? "Carregando categorias..." : "Selecione as tags"
                          }
                          className="min-h-[44px]"
                          hidePlaceholderWhenSelected
                          disabled={categoriasLoading}
                          badgeClassName="bg-primary/10 text-primary border-primary/30"
                          inputProps={{ "aria-label": "Selecionar tags" }}
                        />
                      </FormControl>
                      {selectedTags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                      {selectedTags.map((tag) => {
                        const categoria = categoryMap.get(tag)
                        const Icon = getCategoryIcon(categoria?.icone ?? undefined)
                        const appearance = getBadgeAppearance(categoria)
                        return (
                          <Badge
                            key={`selected-${tag}`}
                            variant="outline"
                            className={appearance.className}
                            style={appearance.style}
                          >
                            <Icon className="mr-1 h-3.5 w-3.5" />
                            {categoria?.nome ?? tag}
                          </Badge>
                        )
                          })}
                        </div>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resumo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resumo</FormLabel>
                      <FormControl>
                        <Textarea rows={6} placeholder="Resumo do trabalho" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="nota"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nota</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="99,5"
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/biblioteca")}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </div>
  )
}
