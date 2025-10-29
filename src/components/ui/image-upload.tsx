import * as React from "react"
import Image from "next/image"
import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageUploadProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: string
  onChange?: (value?: string) => void
  label?: string
  description?: string
  accept?: string
  disabled?: boolean
  previewClassName?: string
}

async function fileToDataUrl(file: File) {
  const reader = new FileReader()
  return new Promise<string>((resolve, reject) => {
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

export function ImageUpload({
  value,
  onChange,
  label,
  description,
  accept = "image/*",
  disabled,
  className,
  previewClassName,
  ...props
}: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState<string | undefined>(value)
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    setPreview(value)
  }, [value])

  const handleSelectFile = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    try {
      const dataUrl = await fileToDataUrl(file)
      setPreview(dataUrl)
      onChange?.(dataUrl)
    } catch (error) {
      console.error("Failed to read image file", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = () => {
    setPreview(undefined)
    onChange?.(undefined)
  }

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {label ? <p className="text-sm font-medium leading-none text-foreground">{label}</p> : null}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}

      <div className="flex items-center gap-4">
        <div
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-border/70 bg-muted/40 text-muted-foreground transition hover:border-primary/60 hover:text-primary",
            previewClassName ?? "h-40 w-full max-w-xs",
            disabled && "cursor-not-allowed opacity-70",
          )}
          onClick={handleSelectFile}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              handleSelectFile()
            }
          }}
        >
          {isLoading ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : preview ? (
            <Image
              src={preview}
              alt="Pré-visualização da imagem"
              fill
              sizes="160px"
              className="rounded-lg object-cover"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <UploadCloud className="size-6" aria-hidden="true" />
              <p className="text-xs font-medium">Clique para enviar</p>
              <p className="text-[10px] text-muted-foreground">PNG, JPG ou WEBP</p>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4" aria-hidden="true" />
            <span>{preview ? "Imagem selecionada" : "Nenhuma imagem selecionada"}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={handleSelectFile} disabled={disabled}>
              Selecionar imagem
            </Button>
            {preview ? (
              <Button variant="ghost" size="sm" type="button" onClick={handleRemove}>
                <X className="mr-1 size-4" aria-hidden="true" />
                Remover
              </Button>
            ) : null}
          </div>
          <p className="text-[11px] leading-relaxed">
            Suporta upload local de arquivos. A imagem selecionada é salva em base64 para facilitar o envio via API.
          </p>
        </div>
      </div>
    </div>
  )
}
