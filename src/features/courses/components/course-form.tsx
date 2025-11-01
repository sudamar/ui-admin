'use client'

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  AlignLeft,
  FileText,
  Image as ImageIcon,
  Lightbulb,
  ScrollText,
  SlidersHorizontal,
  Send,
  Target,
  Users,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FileUpload } from "@/components/ui/file-upload"
import { CurrencyInput } from "@/components/ui/currency-input"
import { ImageUpload } from "@/components/ui/image-upload"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ComposerInput } from "@/components/ui/composer-input"
import {
  cursosService,
  type CourseAvailability,
  type CourseDetails,
} from "@/services/cursos/cursos-service"

const availabilityOptions: { value: CourseAvailability; label: string }[] = [
  { value: "promotion", label: "Promoção" },
  { value: "open", label: "Vagas em aberto" },
  { value: "limited", label: "Faltam 5 vagas" },
  { value: "sold-out", label: "Esgotado" },
]

const currencyField = z
  .number()
  .min(0, "Informe um valor maior ou igual a zero")
  .optional()



function hasHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function normalizeParagraph(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (hasHtml(trimmed)) return trimmed
  const withBreaks = trimmed.replace(/\n/g, "<br />")
  return `<p>${withBreaks}</p>`
}

function htmlToPlainText(value?: string) {
  if (!value) return ""
  if (!hasHtml(value)) return value

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|blockquote|h[1-6])>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
}

function htmlArrayToPlainText(values?: string[]) {
  if (!values || values.length === 0) return ""
  return values
    .map((item) => htmlToPlainText(item))
    .filter(Boolean)
    .join("\n\n")
}

function composerTextToHtml(value?: string) {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (hasHtml(trimmed)) return trimmed

  const blocks = trimmed
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length === 0) return ""
  if (blocks.length === 1) {
    return normalizeParagraph(blocks[0])
  }

  return blocks.map((block) => normalizeParagraph(block)).join("")
}

function composerTextToHtmlArray(value?: string) {
  if (!value) return []
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => normalizeParagraph(block))
}

type CourseFormMode = "create" | "edit"

interface CourseFormProps {
  mode: CourseFormMode
  initialData?: CourseDetails
  onSubmit?: (values: CourseDetails) => void | Promise<void>
  onDelete?: () => boolean | void | Promise<boolean | void>
}

export function CourseForm({ mode, initialData, onSubmit, onDelete }: CourseFormProps) {
  const router = useRouter()
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const courseSchema = useMemo(() => {
    const baseSchema = z.object({
      title: z.string().min(1, "Informe um título"),
      subtitle: z.string().optional(),
      slug:
        z
          .string()
          .min(1, "Informe o slug")
          .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
      category: z.string().min(1, "Informe a categoria"),
      categoryLabel: z.string().optional(),
      modalidade: z.string().optional(),
      duration: z.string().optional(),
      workload: z.string().optional(),
      startDate: z.string().optional(),
      maxStudents: z.string().optional(),
      certificate: z.string().optional(),
      image_folder: z.string().optional(),
      price: currencyField,
      originalPrice: currencyField,
      precoMatricula: currencyField,
      monthlyPrice: z.string().optional(),
      description: z.string().optional(),
      fullDescription: z.string().optional(),
      justificativa: z.string().optional(),
      objetivos: z.string().optional(),
      publico: z.string().optional(),
      ctaLabel: z.string().optional(),
      moreInfoUrl: z.string().optional(),
      videoUrl: z.string().url("Informe uma URL válida").optional().or(z.literal("")),
      availability: z.enum(["promotion", "open", "limited", "sold-out"]),
    });

    if (mode === 'create') {
      return baseSchema.extend({
        image_folder: z.string().min(1, "A imagem de capa é obrigatória"),
        videoUrl: z.string().min(1, "O vídeo da landing page é obrigatório").url("Informe uma URL válida"),
      });
    }

    return baseSchema;
  }, [mode]);

  type CourseFormValues = z.infer<typeof courseSchema>;

  const defaultValues: CourseFormValues = useMemo(() => {
    if (!initialData) {
      return {
        title: "",
        subtitle: "",
        slug: "",
      category: "nao-informado",
        categoryLabel: "",
        modalidade: "",
        duration: "",
        workload: "",
        startDate: "",
        maxStudents: "",
        certificate: "",
        image_folder: undefined,
        price: undefined,
        originalPrice: undefined,
        precoMatricula: undefined,
        monthlyPrice: "",
        description: "",
        fullDescription: "",
        justificativa: "",
        objetivos: "",
        publico: "",
        ctaLabel: "",
        moreInfoUrl: "",
        videoUrl: "",
        availability: "open",
      }
    }

    return {
      title: initialData.title,
      subtitle: initialData.subtitle ?? "",
      slug: initialData.slug,
      category: initialData.category ?? "nao-informado",
      categoryLabel: initialData.categoryLabel ?? "",
      modalidade: initialData.modalidade ?? "",
      duration: initialData.duration ?? "",
      workload: initialData.workload ?? "",
      startDate: initialData.startDate ?? "",
      maxStudents: initialData.maxStudents ?? "",
      certificate: initialData.certificate ?? "",
      image_folder: initialData.image_folder ?? undefined,
      price: initialData.price,
      originalPrice: initialData.originalPrice,
      precoMatricula: initialData.precoMatricula,
      monthlyPrice: initialData.monthlyPrice ?? "",
      description: htmlToPlainText(initialData.description),
      fullDescription: htmlArrayToPlainText(initialData.fullDescription),
      justificativa: htmlArrayToPlainText(initialData.justificativa),
      objetivos: htmlArrayToPlainText(initialData.objetivos),
      publico: htmlArrayToPlainText(initialData.publico),
      ctaLabel: initialData.ctaLabel ?? "",
      moreInfoUrl: initialData.moreInfoUrl ?? "",
      videoUrl: initialData.videoUrl ?? "",
      availability: initialData.availability,
    }
  }, [initialData])

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  })

  const isEdit = mode === "edit"

  const handleSubmit = async (values: CourseFormValues) => {
    const loadingToast = toast.loading(isEdit ? "Atualizando curso..." : "Criando curso...")

    try {
      const payload: CourseDetails = {
        id: initialData?.id ?? 0,
        slug: values.slug,
        title: values.title,
        subtitle: values.subtitle,
        description: composerTextToHtml(values.description),
        fullDescription: composerTextToHtmlArray(values.fullDescription),
        category: values.category,
        categoryLabel: values.categoryLabel,
        image_folder: values.image_folder,
        price: values.price,
        originalPrice: values.originalPrice,
        precoMatricula: values.precoMatricula,
        monthlyPrice: values.monthlyPrice,
        modalidade: values.modalidade,
        duration: values.duration,
        workload: values.workload,
        startDate: values.startDate,
        maxStudents: values.maxStudents,
        certificate: values.certificate,
        justificativa: composerTextToHtmlArray(values.justificativa),
        objetivos: composerTextToHtmlArray(values.objetivos),
        publico: composerTextToHtmlArray(values.publico),
        ctaLabel: values.ctaLabel,
        moreInfoUrl: values.moreInfoUrl,
        videoUrl: values.videoUrl,
        availability: values.availability,
        tags: [],
      }

      console.log("[CourseForm] Enviando payload:", payload)

      const { id, tags, ...rest } = payload
      const saved = isEdit
        ? await cursosService.update(initialData!.id, rest)
        : await cursosService.create(rest)

      if (!saved) {
        toast.dismiss(loadingToast)
        toast.error("Não foi possível salvar o curso.")
        return
      }

      toast.dismiss(loadingToast)
      toast.success(isEdit ? "Curso atualizado com sucesso!" : "Curso criado com sucesso!")
      await onSubmit?.(saved)
      router.push("/dashboard/cursos")
    } catch (error) {
      console.error("[CourseForm] Erro ao salvar curso:", error)
      toast.dismiss(loadingToast)
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao salvar o curso."
      toast.error(errorMessage)
    }
  }

  const handleDelete = async () => {
    try {
      if (!onDelete) return
      const result = await onDelete()
      if (result === false) {
        toast.error("Não foi possível remover o curso.")
        return
      }
      toast.success("Curso removido com sucesso.")
      router.push("/dashboard/cursos")
    } catch (error) {
      console.error(error)
      toast.error("Não foi possível remover o curso.")
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6 pb-28"
      >
        <div className="space-y-6">
          <Card className="shadow-2xl border border-border/60 bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <FileText className="size-4" strokeWidth={2.5} aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                  Informações
                </span>
              </div>
              <CardDescription>Defina como o curso aparecerá no catálogo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Título do curso</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Pós-Graduação em Psicologia Junguiana" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Subtítulo</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição breve do curso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de curso</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                      <SelectTrigger className="w-full capitalize">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="nao-informado">Não informado</SelectItem>
                        <SelectItem value="pos">Pós-Graduação</SelectItem>
                        <SelectItem value="graduacao">Graduação</SelectItem>
                        <SelectItem value="formacao">Formação</SelectItem>
                        <SelectItem value="extensao">Extensão</SelectItem>
                        <SelectItem value="congressos">Congressos</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Define a classificação principal usada no catálogo.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-2xl border border-border/60 bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <SlidersHorizontal className="size-4" strokeWidth={2.5} aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                  Operacional
                </span>
              </div>
              <CardDescription>Configure duração, vagas e certificação.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="modalidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modalidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Presencial, Online, Híbrido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração</FormLabel>
                      <FormControl>
                        <Input placeholder="25 meses" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="workload"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carga horária</FormLabel>
                      <FormControl>
                        <Input placeholder="400h" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início previsto</FormLabel>
                      <FormControl>
                        <Input placeholder="Março 2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxStudents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vagas</FormLabel>
                      <FormControl>
                        <Input placeholder="Máx. 25 alunos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="certificate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificação</FormLabel>
                      <FormControl>
                        <Input placeholder="Reconhecida MEC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponibilidade</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availabilityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Controla os badges de status exibidos no catálogo.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

           {/* ************* Card Detalhes de slug e etiqueta) ******************/}
          <Card className="shadow-2xl border border-border/60 bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ImageIcon className="size-4" strokeWidth={2.5} aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                  Detalhes
                </span>
              </div>
              <CardDescription>Slug, etiqueta e imagem organizados em um único cartão.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="pos-graduacao-psicologia-junguiana" {...field} />
                    </FormControl>
                    <FormDescription>Usado nas URLs e integrações.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryLabel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etiqueta da categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Pós-Graduação" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

        {/* ************* Card Financeiro ******************/}
          <Card className="shadow-2xl border border-border/60 bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Wallet className="size-4" strokeWidth={2.5} aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                  Financeiro
                </span>
              </div>
              <CardDescription>Configure valores, matrícula e ações de conversão.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor vigente</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onValueChange={(val) => field.onChange(val ?? undefined)}
                        placeholder="R$ 0,00"
                        onBlur={field.onBlur}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="originalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor original</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onValueChange={(val) => field.onChange(val ?? undefined)}
                        placeholder="R$ 0,00"
                        onBlur={field.onBlur}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
              <FormField
                control={form.control}
                name="precoMatricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matrícula</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        name={field.name}
                        ref={field.ref}
                        value={field.value}
                        onValueChange={(val) => field.onChange(val ?? undefined)}
                        placeholder="R$ 0,00"
                        onBlur={field.onBlur}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
              <FormField
                control={form.control}
                name="monthlyPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensalidade</FormLabel>
                    <FormControl>
                      <Input placeholder="R$ 160,56/mês" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
              <FormField
                control={form.control}
                name="ctaLabel"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-1">
                    <FormLabel>Texto do botão</FormLabel>
                    <FormControl>
                      <Input placeholder="Quero me inscrever" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
              <FormField
                control={form.control}
                name="moreInfoUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>URL de matrícula / mais informações</FormLabel>
                    <FormControl>
                      <Input placeholder="https://ijep.com.br/inscricao/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
                />
            </CardContent>
          </Card>

          {/* ************* Card Mídias do curso ******************/}
          <Card className="shadow-2xl border border-border/60 bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ImageIcon className="size-4" strokeWidth={2.5} aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                  Mídias do Curso
                </span>
              </div>
              <CardDescription>Faça upload da imagem de capa e vídeo de apresentação do curso.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="image_folder"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Imagem de capa</FormLabel>
                    <FormControl>
                      <FileUpload
                        onChange={(files) => {
                          const file = files[0]
                          if (file) {
                            setImageFile(file)
                            const imageUrl = URL.createObjectURL(file)
                            field.onChange(imageUrl)
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Faça upload de uma imagem 16:9.
                    </FormDescription>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-4">
                        <img
                          src={field.value}
                          alt="Preview da imagem"
                          className="w-1/3 mx-auto rounded-md"
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Vídeo da Landing Page</FormLabel>
                    <FormControl>
                      <FileUpload
                        onChange={(files) => {
                          const file = files[0]
                          if (file) {
                            setVideoFile(file)
                            const videoUrl = URL.createObjectURL(file)
                            field.onChange(videoUrl)
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-4">
                        <video
                          src={field.value}
                          controls
                          className="w-1/3 mx-auto rounded-md"
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

       
          {/* ************* Card Descrição resumida ******************/}
          <Card className="shadow-2xl border border-border/60 bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <AlignLeft className="size-4" strokeWidth={2.5} aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                  Descrição resumida
                </span>
              </div>
              <CardDescription>Apresente brevemente o curso no catálogo. O conteúdo continuará a ser salvo em HTML.</CardDescription>
            </CardHeader>
            <CardContent>
              <ComposerInput
                value={form.watch("description") ?? ""}
                onValueChange={(val) => form.setValue("description", val, { shouldDirty: true })}
                onSend={(message) =>
                  form.setValue("description", message, { shouldDirty: true })
                }
                clearOnSend={false}
                placeholder="Resumo do curso..."
                textareaClassName="min-h-[220px]"
                aria-label="Descrição resumida do curso"
              />
            </CardContent>
          </Card>

          <Card className="shadow-2xl border border-border/60 bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ScrollText className="size-4" strokeWidth={2.5} aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                  Descrição
                </span>
              </div>
              <CardDescription>Detalhe módulos, diferenciais e conteúdo completo. O texto será convertido para HTML na publicação.</CardDescription>
            </CardHeader>
            <CardContent>
              <ComposerInput
                value={form.watch("fullDescription") ?? ""}
                onValueChange={(val) => form.setValue("fullDescription", val, { shouldDirty: true })}
                onSend={(message) => form.setValue("fullDescription", message, { shouldDirty: true })}
                clearOnSend={false}
                placeholder="Detalhes completos do curso..."
                textareaClassName="min-h-[320px]"
                aria-label="Descrição detalhada do curso"
              />
            </CardContent>
          </Card>

          <Card className="shadow-2xl border border-border/60 bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Lightbulb className="size-4" strokeWidth={2.5} aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                  Narrativa
                </span>
              </div>
              <CardDescription>Explique o propósito do curso. Cada parágrafo será convertido em HTML.</CardDescription>
            </CardHeader>
            <CardContent>
              <ComposerInput
                value={form.watch("justificativa") ?? ""}
                onValueChange={(val) => form.setValue("justificativa", val, { shouldDirty: true })}
                onSend={(message) => form.setValue("justificativa", message, { shouldDirty: true })}
                clearOnSend={false}
                placeholder="Por que ofertar este curso?"
                textareaClassName="min-h-[260px]"
                aria-label="Justificativa do curso"
              />
            </CardContent>
          </Card>

          <Card className="shadow-2xl border border-border/60 bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Target className="size-4" strokeWidth={2.5} aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                  Estratégia
                </span>
              </div>
              <CardDescription>Defina metas de aprendizado. Separe objetivos com linhas em branco para gerar parágrafos distintos.</CardDescription>
            </CardHeader>
            <CardContent>
              <ComposerInput
                value={form.watch("objetivos") ?? ""}
                onValueChange={(val) => form.setValue("objetivos", val, { shouldDirty: true })}
                onSend={(message) => form.setValue("objetivos", message, { shouldDirty: true })}
                clearOnSend={false}
                placeholder="Objetivos do curso..."
                textareaClassName="min-h-[260px]"
                aria-label="Objetivos do curso"
              />
            </CardContent>
          </Card>

          <Card className="shadow-2xl border border-border/60 bg-card">
            <CardHeader className="flex flex-col gap-4">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Users className="size-4" strokeWidth={2.5} aria-hidden="true" />
                <span className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">
                  Público
                </span>
              </div>
              <CardDescription>Detalhe quem se beneficia diretamente do curso. O conteúdo será transformado em HTML automaticamente.</CardDescription>
            </CardHeader>
            <CardContent>
              <ComposerInput
                value={form.watch("publico") ?? ""}
                onValueChange={(val) => form.setValue("publico", val, { shouldDirty: true })}
                onSend={(message) => form.setValue("publico", message, { shouldDirty: true })}
                clearOnSend={false}
                placeholder="Profissionais indicados..."
                textareaClassName="min-h-[260px]"
                aria-label="Público-alvo do curso"
              />
            </CardContent>
          </Card>

        </div>

        <Card className="shadow-2xl border border-border/60 bg-card">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Send className="size-4" strokeWidth={2.5} aria-hidden="true" />
              <span className="text-xs uppercase tracking-[0.2em] font-semibold text-foreground">Ações</span>
            </div>
            <CardDescription>Finalize as alterações ou descarte o rascunho.</CardDescription>
          </CardHeader>
          <CardFooter className="sticky bottom-4 left-0 right-0 z-40 flex flex-col gap-3 rounded-lg border border-border/60 bg-card/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/75 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Os campos com texto usam o Composer em HTML. Revise a formatação antes de publicar.
            </div>
            <div className="flex flex-wrap gap-2">
              {isEdit ? (
                <Button type="button" variant="outline" onClick={handleDelete}>
                  Remover curso
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/cursos")}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-500 text-white hover:bg-emerald-600 focus-visible:ring-emerald-500"
              >
                Publicar Alterações
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}