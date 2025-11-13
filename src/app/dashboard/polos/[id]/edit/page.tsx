"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { polosService } from "@/services/polos/polos-service"

const editPoloSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, { message: "Informe um slug com pelo menos 2 caracteres." })
    .max(100, { message: "O slug pode ter no máximo 100 caracteres." })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      message: "Use apenas letras minúsculas, números e hífens (ex: belo-horizonte).",
    }),
  name: z.string().min(3, { message: "Informe um nome válido." }),
  address: z
    .string()
    .trim()
    .min(5, { message: "Informe um endereço válido." })
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(8, { message: "Informe um telefone válido." })
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email({ message: "Informe um e-mail válido." })
    .or(z.literal("")),
  coordinator: z
    .string()
    .trim()
    .min(3, { message: "Informe um nome válido." })
    .or(z.literal("")),
  mapUrl: z
    .string()
    .trim()
    .url({ message: "Informe uma URL válida." })
    .or(z.literal("")),
})

type EditPoloFormValues = z.infer<typeof editPoloSchema>

export default function EditPoloPage() {
  const router = useRouter()
  const params = useParams()
  const poloId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const form = useForm<EditPoloFormValues>({
    resolver: zodResolver(editPoloSchema),
    defaultValues: {
      slug: "",
      name: "",
      address: "",
      phone: "",
      email: "",
      coordinator: "",
      mapUrl: "",
    },
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const polo = await polosService.getById(poloId)
        if (!polo) {
          router.push("/dashboard/polos")
          return
        }

        form.reset({
          slug: polo.slug,
          name: polo.name,
          address: polo.address ?? "",
          phone: polo.phone ?? "",
          email: polo.email ?? "",
          coordinator: polo.coordinator ?? "",
          mapUrl: polo.mapUrl ?? "",
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [form, poloId, router])

  const handleSubmit = async (values: EditPoloFormValues) => {
    setSaving(true)
    try {
      await polosService.update(poloId, {
        slug: values.slug,
        name: values.name,
        address: values.address || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        coordinator: values.coordinator || undefined,
        mapUrl: values.mapUrl || undefined,
      })

      router.push("/dashboard/polos")
    } catch (error) {
      console.error("Erro ao atualizar polo:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">Carregando polo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/polos">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar polo</h1>
          <p className="text-muted-foreground">
            Atualize os dados do polo acadêmico selecionado.
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Informações do polo</CardTitle>
                <CardDescription>
                  Faça os ajustes necessários e salve as alterações.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (identificador)</FormLabel>
                      <FormControl>
                        <Input placeholder="belo-horizonte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do polo</FormLabel>
                      <FormControl>
                        <Input placeholder="Polo Belo Horizonte" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Rua Exemplo, 123..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(31) 3333-4444" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contato@fafih.edu.br" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coordinator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coordenador(a)</FormLabel>
                      <FormControl>
                        <Input placeholder="Prof. Dr. João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mapUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL do mapa</FormLabel>
                      <FormControl>
                        <Input placeholder="https://maps.google.com/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </CardContent>
              <CardFooter className="flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/polos")}
                  disabled={saving}
                >
                  Cancelar
                </Button>
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
