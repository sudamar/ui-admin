'use client'

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import {
  AlignLeft,
  FileText,
  ImageIcon,
  Lightbulb,
  ScrollText,
  Send,
  SlidersHorizontal,
  Target,
  Users,
  Wallet,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RichTextEditorHybrid } from "@/components/shared/rich-text-editor-hybrid"
import { FileUpload } from "@/components/ui/file-upload"
import { CurrencyInput } from "@/components/ui/currency-input"
import { cursosService, type CourseDetails, type CourseAvailability } from "@/services/cursos/cursos-service"
import { professoresService } from "@/services/professores/professores-service"
import type { Professor } from "@/features/professores/types"

// Função para capitalizar primeira letra
function capitalize(str: string): string {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Enum de categorias baseado no database categoria_cursos
const categoryCourseOptions = [
  { value: " ", label: "Não informado" },
  { value: "especialização", label: "Especialização" },
  { value: "graduação", label: "Graduação" },
  { value: "formação", label: "Formação" },
  { value: "extensão", label: "Extensão" },
  { value: "congressos", label: "Congressos" },
] as const

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

function htmlToHtmlArray(value?: string): string[] {
  if (!value) return []
  const trimmed = value.trim()
  if (!trimmed) return []

  // Se já é HTML, dividir pelos elementos de bloco
  const parser = new DOMParser()
  const doc = parser.parseFromString(trimmed, 'text/html')
  const elements = Array.from(doc.body.children)

  if (elements.length === 0) {
    // Caso não tenha elementos, retornar como parágrafo único
    return [trimmed]
  }

  return elements.map(el => el.outerHTML).filter(Boolean)
}

function arrayToRecord(arr: string[]): Record<string, unknown> {
  if (!arr || arr.length === 0) return {}

  // Converter array para objeto com índices numéricos
  return arr.reduce((acc, item, index) => {
    acc[index.toString()] = item
    return acc
  }, {} as Record<string, unknown>)
}

function recordToArray(record?: Record<string, unknown> | string[] | string | null): string[] {
  // Se já é array, retorna como está
  if (Array.isArray(record)) return record

  // Se é null, undefined, string ou não é objeto, retorna array vazio
  if (!record || typeof record !== 'object') return []

  // Converter Record para array, mantendo a ordem dos índices
  return Object.keys(record)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(key => String(record[key]))
    .filter(Boolean)
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
  const [professores, setProfessores] = useState<Professor[]>([])

  useEffect(() => {
    const fetchProfessores = async () => {
      const data = await professoresService.getAll()
      setProfessores(data)
    }
    void fetchProfessores()
  }, [])

  const courseSchema = z.object({
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
    shortDescription: z.string().optional(),
    fullDescription: z.string().optional(),
    justificativa: z.string().optional(),
    objetivos: z.string().optional(),
    publico: z.string().optional(),
    videoUrl: z.string().optional(),
    availability: z.enum(["promotion", "open", "limited", "sold-out"]),
    coordenadorId: z.string().optional(),
  });

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
        shortDescription: "",
        fullDescription: "",
        justificativa: "",
        objetivos: "",
        publico: "",
        videoUrl: "",
        availability: "open",
        coordenadorId: "",
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
      shortDescription: initialData.shortDescription ?? "",
      fullDescription: recordToArray(initialData.fullDescription as Record<string, unknown> | string[] | undefined).join(""),
      justificativa: recordToArray(initialData.justificativa as Record<string, unknown> | string[] | undefined).join(""),
      objetivos: recordToArray(initialData.objetivos as Record<string, unknown> | string[] | undefined).join(""),
      publico: recordToArray(initialData.publico as Record<string, unknown> | string[] | undefined).join(""),
      videoUrl: initialData.videoUrl ?? "",
      availability: initialData.availability ?? "open",
      coordenadorId: initialData.coordenadorId ?? "",
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
      console.log("=== [CourseForm] INÍCIO DO SUBMIT ===")
      console.log("[CourseForm] Modo:", mode)
      console.log("[CourseForm] Values do formulário:", values)

      const payload: CourseDetails = {
        id: initialData?.id ?? "",
        slug: values.slug,
        title: values.title,
        subtitle: values.subtitle,
        shortDescription: values.shortDescription,
        fullDescription: htmlToHtmlArray(values.fullDescription),
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
        justificativa: htmlToHtmlArray(values.justificativa),
        objetivos: htmlToHtmlArray(values.objetivos),
        publico: htmlToHtmlArray(values.publico),
        videoUrl: values.videoUrl,
        availability: values.availability,
        coordenadorId: values.coordenadorId,
        tags: [],
      }

      console.log("[CourseForm] 1. Payload inicial (CourseDetails):", JSON.stringify(payload, null, 2))

      const { id, tags, fullDescription, justificativa, objetivos, publico, ...rest } = payload

      console.log("[CourseForm] 2. Arrays extraídos:")
      console.log("  - fullDescription:", fullDescription)
      console.log("  - justificativa:", justificativa)
      console.log("  - objetivos:", objetivos)
      console.log("  - publico:", publico)

      // Converter arrays para Record para o backend
      const backendPayload = {
        ...rest,
        fullDescription: arrayToRecord(fullDescription || []),
        justificativa: arrayToRecord(justificativa || []),
        objetivos: arrayToRecord(objetivos || []),
        publico: arrayToRecord(publico || []),
      }

      console.log("[CourseForm] 3. Backend payload (com Records):", JSON.stringify(backendPayload, null, 2))
      console.log("[CourseForm] 4. Chamando cursosService.update/create...")
      console.log("[CourseForm]    - isEdit:", isEdit)
      console.log("[CourseForm]    - initialData?.id:", initialData?.id)

      const saved = isEdit
        ? await cursosService.update(initialData!.id, backendPayload)
        : await cursosService.create(backendPayload)

      console.log("[CourseForm] 5. Resposta do cursosService:")
      console.log(JSON.stringify(saved, null, 2))

      if (!saved) {
        console.error("[CourseForm] ❌ Resposta é null ou undefined")
        toast.dismiss(loadingToast)
        toast.error("Não foi possível salvar o curso.")
        return
      }

      console.log("[CourseForm] 6. Convertendo Curso para CourseDetails...")

      // Converter Curso para CourseDetails
      const courseDetails: CourseDetails = {
        ...saved,
        fullDescription: recordToArray(saved.fullDescription),
        justificativa: recordToArray(saved.justificativa),
        objetivos: recordToArray(saved.objetivos),
        publico: recordToArray(saved.publico),
      }

      console.log("[CourseForm] 7. CourseDetails final:")
      console.log(JSON.stringify(courseDetails, null, 2))

      toast.dismiss(loadingToast)
      toast.success(isEdit ? "Curso atualizado com sucesso!" : "Curso criado com sucesso!")

      console.log("[CourseForm] 8. Chamando onSubmit callback...")
      await onSubmit?.(courseDetails)

      console.log("[CourseForm] 9. Redirecionando para /dashboard/cursos")
      router.push("/dashboard/cursos")
    } catch (error) {
      console.error("[CourseForm] ========== ERRO CAPTURADO ==========")
      console.error("[CourseForm] Erro ao salvar curso:", error)
      console.error("[CourseForm] Tipo do erro:", typeof error)
      console.error("[CourseForm] Nome do erro:", error instanceof Error ? error.name : "Unknown")
      console.error("[CourseForm] Mensagem do erro:", error instanceof Error ? error.message : String(error))
      console.error("[CourseForm] Stack trace:", error instanceof Error ? error.stack : "N/A")
      console.error("[CourseForm] ============================================")

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

  const handleValidationError = (errors: typeof form.formState.errors) => {
    const errorMessages = Object.entries(errors)
      .map(([field, error]) => {
        const fieldName = field === 'title' ? 'Título' :
                         field === 'slug' ? 'Slug' :
                         field === 'category' ? 'Tipo de curso' :
                         field === 'image_folder' ? 'Imagem de capa' :
                         field === 'videoUrl' ? 'Vídeo' :
                         field
        return `${fieldName}: ${error?.message || 'Campo inválido'}`
      })

    if (errorMessages.length > 0) {
      errorMessages.forEach(msg => toast.error(msg))
    }
  }

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit, handleValidationError)}
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
                      <Input placeholder="Ex.: Psicologia Junguiana" {...field} />
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
                        {categoryCourseOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="capitalize">
                            {capitalize(option.label)}
                          </SelectItem>
                        ))}
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

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="coordenadorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coordenador</FormLabel>
                      <div className="flex gap-2">
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione o coordenador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {professores.map((professor) => (
                              <SelectItem key={professor.id} value={professor.id}>
                                {professor.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.value && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => field.onChange("")}
                            title="Remover coordenador"
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                      <FormDescription>
                        Selecione o coordenador responsável pelo curso.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
              </div>
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
              <CardDescription>Apresente brevemente o curso no catálogo. Use a formatação rica para destacar informações importantes.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RichTextEditorHybrid
                        value={field.value ?? ""}
                        onChange={(html) => field.onChange(html)}
                        placeholder="Resumo do curso..."
                        minHeight="220px"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
              <CardDescription>Detalhe módulos, diferenciais e conteúdo completo. Use títulos, listas e negrito para organizar o conteúdo.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="fullDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RichTextEditorHybrid
                        value={field.value ?? ""}
                        onChange={(html) => field.onChange(html)}
                        placeholder="Detalhes completos do curso..."
                        minHeight="320px"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
              <CardDescription>Explique o propósito do curso. Use parágrafos e formatação para tornar o texto mais atraente.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="justificativa"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RichTextEditorHybrid
                        value={field.value ?? ""}
                        onChange={(html) => field.onChange(html)}
                        placeholder="Por que ofertar este curso?"
                        minHeight="260px"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
              <CardDescription>Defina metas de aprendizado. Use listas para organizar os objetivos de forma clara.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="objetivos"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RichTextEditorHybrid
                        value={field.value ?? ""}
                        onChange={(html) => field.onChange(html)}
                        placeholder="Objetivos do curso..."
                        minHeight="260px"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
              <CardDescription>Detalhe quem se beneficia diretamente do curso. Use listas para destacar os diferentes perfis profissionais.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="publico"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RichTextEditorHybrid
                        value={field.value ?? ""}
                        onChange={(html) => field.onChange(html)}
                        placeholder="Profissionais indicados..."
                        minHeight="260px"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
              Os campos de texto suportam formatação rica (negrito, listas, títulos). Revise o conteúdo antes de publicar.
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