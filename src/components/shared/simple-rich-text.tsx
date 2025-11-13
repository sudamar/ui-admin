'use client'

import { useState, useRef, useEffect } from 'react'

interface SimpleRichTextProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function SimpleRichText({
  value = '',
  onChange,
  placeholder = 'Digite aqui...',
  minHeight = '200px'
}: SimpleRichTextProps) {
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
      console.log('[SimpleRichText] HTML:', html)
      console.log('[SimpleRichText] Text:', editorRef.current.textContent)
      onChange(html)
    }
  }

  return (
    <div className="relative border border-border rounded-lg overflow-hidden bg-background">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="outline-none px-4 py-3 prose prose-sm max-w-none"
        style={{
          minHeight,
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'embed'
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
  )
}
