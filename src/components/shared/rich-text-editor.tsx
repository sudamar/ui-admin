'use client'

import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

const toolbarButtons = [
  { icon: "B", command: "bold", label: "Negrito" },
  { icon: "I", command: "italic", label: "Itálico" },
  { icon: "U", command: "underline", label: "Sublinhado" },
  { icon: "•", command: "insertUnorderedList", label: "Lista" },
  { icon: "1.", command: "insertOrderedList", label: "Lista numerada" },
  { icon: "“”", command: "formatBlock", value: "blockquote", label: "Citação" },
]

interface RichTextEditorProps {
  id: string
  label?: string
  description?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
}

export function RichTextEditor({
  id,
  label,
  description,
  value,
  onChange,
  placeholder,
  minHeight = 320,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [tab, setTab] = useState<"write" | "preview">("write")

  const exec = (command: string, value?: string) => {
    if (command === "formatBlock" && value) {
      document.execCommand(command, false, value)
    } else {
      document.execCommand(command, false, value ?? "")
    }
    editorRef.current?.focus()
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="space-y-2">
      {label ? <Label htmlFor={id}>{label}</Label> : null}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}

      <Tabs value={tab} onValueChange={(val) => setTab(val as typeof tab)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="write">Editar</TabsTrigger>
          <TabsTrigger value="preview">Pré-visualizar</TabsTrigger>
        </TabsList>
        <TabsContent value="write" className="mt-2">
          <Card className="border bg-card">
            <div className="flex flex-wrap gap-1 border-b bg-muted/50 p-2">
              {toolbarButtons.map((button) => (
                <Button
                  key={button.label}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-sm text-muted-foreground"
                  title={button.label}
                  onClick={() => exec(button.command, button.value)}
                >
                  {button.icon}
                </Button>
              ))}
            </div>
            <div
              ref={editorRef}
              id={id}
              role="textbox"
              contentEditable
              data-placeholder={placeholder}
              suppressContentEditableWarning
              style={{ minHeight }}
              className="prose prose-sm max-w-none whitespace-pre-wrap rounded-b-md bg-background p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onBlur={() => {
                if (editorRef.current) {
                  onChange(editorRef.current.innerHTML)
                }
              }}
              dangerouslySetInnerHTML={{ __html: value }}
            />
          </Card>
        </TabsContent>
        <TabsContent
          value="preview"
          className="mt-2 rounded-md border bg-muted/40 p-4"
        >
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: value || "<p class='text-muted-foreground text-sm'>Nenhum conteúdo.</p>",
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
