import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  Code,
  CornerDownLeft,
  Image as ImageIcon,
  Link,
  List,
  ListOrdered,
  Mic,
  Paperclip,
  Quote,
  Trash2,
  Wand2,
} from "lucide-react"
import { Cross2Icon, DotsHorizontalIcon, FontBoldIcon, FontItalicIcon, UnderlineIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define the structure for an attachment
export interface Attachment {
  id: string
  fileName: string
  fileType: "image" | "document"
  thumbnailUrl?: string // URL for image previews
}

// Define props for the component
export interface ComposerInputProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  attachments?: Attachment[]
  onAttachmentsChange?: (attachments: Attachment[]) => void
  onSend?: (message: string, attachments: Attachment[]) => void
  initialAttachments?: Attachment[]
  placeholder?: string
  sendLabel?: string
  clearOnSend?: boolean
  textareaClassName?: string
}

const ComposerInput = React.forwardRef<HTMLDivElement, ComposerInputProps>(
  (props, ref) => {
    const {
      className,
      value,
      onValueChange,
      attachments,
      onAttachmentsChange,
      onSend = () => {},
      initialAttachments = [],
      placeholder = "Type your message...",
      sendLabel = "Send",
      clearOnSend = true,
      textareaClassName,
      ...rest
    } = props

    const [internalMessage, setInternalMessage] = React.useState("")
    const [internalAttachments, setInternalAttachments] = React.useState<Attachment[]>(initialAttachments)

    const currentMessage = value ?? internalMessage
    const currentAttachments = attachments ?? internalAttachments

    React.useEffect(() => {
      if (attachments) {
        setInternalAttachments(attachments)
      }
    }, [attachments])

    React.useEffect(() => {
      if (!attachments && initialAttachments.length > 0) {
        setInternalAttachments(initialAttachments)
      }
    }, [attachments, initialAttachments])

    const setMessage = React.useCallback(
      (next: string) => {
        onValueChange?.(next)
        if (value === undefined) {
          setInternalMessage(next)
        }
      },
      [onValueChange, value],
    )

    const updateAttachments = React.useCallback(
      (next: Attachment[]) => {
        onAttachmentsChange?.(next)
        if (attachments === undefined) {
          setInternalAttachments(next)
        }
      },
      [attachments, onAttachmentsChange],
    )

    const handleSend = React.useCallback(() => {
      if (!currentMessage.trim() && currentAttachments.length === 0) return
      onSend(currentMessage, currentAttachments)
      if (clearOnSend) {
        setMessage("")
        updateAttachments([])
      }
    }, [clearOnSend, currentAttachments, currentMessage, onSend, setMessage, updateAttachments])

    const handleRemoveAttachment = React.useCallback(
      (id: string) => {
        updateAttachments(currentAttachments.filter((att) => att.id !== id))
      },
      [currentAttachments, updateAttachments],
    )

    const toolbarItems = [
      { icon: FontBoldIcon, tooltip: "Bold" },
      { icon: FontItalicIcon, tooltip: "Italic" },
      { icon: UnderlineIcon, tooltip: "Underline" },
      { icon: List, tooltip: "Bullet List" },
      { icon: ListOrdered, tooltip: "Numbered List" },
      { icon: Quote, tooltip: "Quote" },
      { icon: Code, tooltip: "Code" },
      { icon: Link, tooltip: "Link" },
    ]

    const actionItems = [
      { icon: Paperclip, tooltip: "Attach File" },
      { icon: Mic, tooltip: "Voice Message" },
      { icon: ImageIcon, tooltip: "Add Image" },
      { icon: Wand2, tooltip: "AI Assist" },
      { icon: DotsHorizontalIcon, tooltip: "More Options" },
    ]

    return (
      <TooltipProvider>
        <div
          ref={ref}
          className={cn(
            "flex flex-col w-full rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-300 ease-in-out focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
            className,
          )}
          {...rest}
        >
          {/* Top Toolbar */}
          <div className="flex items-center justify-between p-2 border-b">
            <div className="flex items-center gap-1">
              {toolbarItems.map((item, index) => (
                <Tooltip key={item.tooltip}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <item.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => {
                    setMessage("")
                    updateAttachments([])
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Main text area */}
          <div className="p-2 flex-grow">
            <Textarea
              value={currentMessage}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "w-full min-h-[120px] border-0 resize-vertical focus-visible:ring-0 focus-visible:ring-offset-0 p-2",
                textareaClassName,
              )}
            />
          </div>

          {/* Attachments Preview */}
          {currentAttachments.length > 0 && (
            <div className="px-4 pb-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                <AnimatePresence>
                  {currentAttachments.map((att) => (
                    <motion.div
                      key={att.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="relative group"
                    >
                      <div className="aspect-square w-full rounded-md overflow-hidden bg-muted flex items-center justify-center">
                        {att.fileType === "image" && att.thumbnailUrl ? (
                          <img src={att.thumbnailUrl} alt={att.fileName} className="h-full w-full object-cover" />
                        ) : (
                          <Paperclip className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="absolute -top-1 -right-1 bg-background border rounded-full p-0.5 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove attachment"
                        type="button"
                      >
                        <Cross2Icon className="h-3 w-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between p-2 border-t">
            <div className="flex items-center gap-1">
              {actionItems.map((item, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <item.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button onClick={handleSend} size="sm" type="button">
                {sendLabel}
                <CornerDownLeft className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </TooltipProvider>
    )
  }
)

ComposerInput.displayName = "ComposerInput"

export { ComposerInput }
