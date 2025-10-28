"use client"

import { useEffect, useState } from "react"
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
import { ArrowLeft, Save } from "lucide-react"

import { trabalhosService, type Trabalho } from "@/services/trabalhos/trabalhos-service"
import categoriasData from "@/data/trabalhos/trabalhos_categorias.json"

const categoryMap = new Map<string, { label: string }>(
  categoriasData.map((categoria) => [categoria.slug, { label: categoria.label }]),
)

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
    .refine(
      (value) =>
        !value ||
        (!Number.isNaN(Number.parseFloat(value)) &&
          Number.parseFloat(value) >= 0 &&
          Number.parseFloat(value) <= 10),
      "Informe uma nota entre 0 e 10",
    ),
  visitantes: z
    .string()
    .min(1, "Informe a quantidade de visitas")
    .refine((value) => !Number.isNaN(Number.parseInt(value)) && Number.parseInt(value) >= 0, "Informe um número válido"),
  baixados: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value ||
        (!Number.isNaN(Number.parseInt(value)) && Number.parseInt(value) >= 0),
      "Informe um número válido",
    ),
})

type TrabalhoFormValues = z.infer<typeof trabalhoSchema>

const tagOptions: Option[] = categoriasData.map((categoria) => ({
  value: categoria.slug,
  label: categoria.label,
}))

export default function EditTrabalhoPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    const load = async () => {
      try {
        const trabalho = await trabalhosService.getBySlug(slug)
        if (!trabalho) {
          router.push("/dashboard/biblioteca")
          return
        }

        form.reset({
          titulo: trabalho.titulo,
          autor: trabalho.autor,
          data_publicacao: trabalho.data_publicacao,
          link: trabalho.link,
          tags: trabalho.tags,
          resumo: trabalho.resumo ?? "",
          nota: trabalho.nota?.toString() ?? "",
          visitantes: trabalho.visitantes.toString(),
          baixados: trabalho.baixados?.toString() ?? "",
          arquivo: trabalho.arquivo ?? "",
        })
      } catch (error) {
        console.error("Erro ao carregar trabalho", error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [form, router, slug])

  const onSubmit = async (values: TrabalhoFormValues) => {
    setSaving(true)
    try {
      const payload: Trabalho = {
        titulo: values.titulo,
        autor: values.autor,
        data_publicacao: values.data_publicacao,
        link: values.link,
        tags: values.tags,
        slug,
        resumo: values.resumo,
        arquivo: values.arquivo ? values.arquivo : undefined,
        nota: values.nota ? Number.parseFloat(values.nota) : undefined,
        visitantes: Number.parseInt(values.visitantes, 10),
        baixados: values.baixados ? Number.parseInt(values.baixados, 10) : undefined,
      }

      await trabalhosService.update(slug, payload)
      router.push("/dashboard/biblioteca")
    } catch (error) {
      console.error("Erro ao atualizar trabalho", error)
    } finally {
      setSaving(false)
    }
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Informações principais</CardTitle>
                <CardDescription>Altere os dados conforme necessário.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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

                <div className="grid gap-6 md:grid-cols-2">
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
                </div>

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
                            {field.value.startsWith("data:application/pdf")
                              ? "Arquivo em base64"
                              : field.value}
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
                            label: categoryMap.get(value)?.label ?? value,
                          }))}
                          onChange={(options) => field.onChange(options.map((option) => option.value))}
                          options={tagOptions}
                          placeholder="Selecione as tags"
                          className="min-h-[44px]"
                          hidePlaceholderWhenSelected
                          badgeClassName="bg-primary/10 text-primary border-primary/30"
                          inputProps={{ "aria-label": "Selecionar tags" }}
                        />
                      </FormControl>
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
                            type="number"
                            step="0.1"
                            min={0}
                            max={10}
                            placeholder="9.5"
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="visitantes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visitas</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="baixados"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Downloads</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
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
