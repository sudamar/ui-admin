"use client"

import { useRef, useEffect, useState, type KeyboardEvent } from "react"
import { Bold, Italic, List, ListOrdered, Heading2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface RichTextEditorHybridProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditorHybrid({
  value = "",
  onChange,
  placeholder = "Digite aqui...",
  minHeight = "200px",
}: RichTextEditorHybridProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current && onChange) {
      const html = editorRef.current.innerHTML
      onChange(html)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const formatBold = () => execCommand("bold")
  const formatItalic = () => execCommand("italic")
  const formatHeading = () => execCommand("formatBlock", "h2")
  const insertUnorderedList = () => execCommand("insertUnorderedList")
  const insertOrderedList = () => execCommand("insertOrderedList")

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!event.metaKey && !event.ctrlKey) return
    const key = event.key.toLowerCase()
    switch (key) {
      case "b":
        event.preventDefault()
        event.stopPropagation()
        formatBold()
        break
      case "i":
        event.preventDefault()
        event.stopPropagation()
        formatItalic()
        break
      default:
        break
    }
  }

  return (
    <div className="relative border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-2 rounded-t-lg">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault()
            formatBold()
          }}
          className="h-8 w-8 p-0"
          title="Negrito (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault()
            formatItalic()
          }}
          className="h-8 w-8 p-0"
          title="Itálico (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault()
            formatHeading()
          }}
          className="h-8 w-8 p-0"
          title="Título (H2)"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault()
            insertUnorderedList()
          }}
          className="h-8 w-8 p-0"
          title="Lista com marcadores"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault()
            insertOrderedList()
          }}
          className="h-8 w-8 p-0"
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className="outline-none px-4 py-3 prose prose-sm max-w-none focus:ring-0"
          style={{
            minHeight,
            direction: "ltr",
            textAlign: "left",
            unicodeBidi: "embed",
          }}
          dir="ltr"
          lang="pt-BR"
          suppressContentEditableWarning
        />
        {!isFocused && !editorRef.current?.textContent?.trim() && (
          <div className="absolute top-3 left-4 text-muted-foreground pointer-events-none select-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}
