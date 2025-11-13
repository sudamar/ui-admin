'use client'

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { LinkNode } from '@lexical/link';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { $getRoot, EditorState, LexicalEditor } from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode } from '@lexical/rich-text';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';

const editorTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'mb-2 text-base leading-relaxed',
  heading: {
    h1: 'text-3xl font-bold mb-4 mt-6',
    h2: 'text-2xl font-bold mb-3 mt-5',
    h3: 'text-xl font-bold mb-2 mt-4',
  },
  list: {
    ul: 'list-disc list-inside mb-2 ml-4',
    ol: 'list-decimal list-inside mb-2 ml-4',
    listitem: 'mb-1',
  },
  text: {
    bold: 'font-bold',
    italic: 'italic',
    underline: 'underline',
  },
};

function onError(error: Error) {
  console.error('[RichTextEditor] Error:', error);
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();

  const formatText = (format: 'bold' | 'italic' | 'underline') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const formatHeading = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode('h2'));
      }
    });
  };

  const insertBulletList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const insertNumberedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-2 rounded-t-lg">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatText('bold')}
        className="h-8 w-8 p-0"
        title="Negrito (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => formatText('italic')}
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
        onClick={formatHeading}
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
        onClick={insertBulletList}
        className="h-8 w-8 p-0"
        title="Lista com marcadores"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={insertNumberedList}
        className="h-8 w-8 p-0"
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
}


function InitialContentPlugin({ html }: { html?: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!html || !html.trim()) return;

    editor.update(() => {
      try {
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, 'text/html');
        const nodes = $generateNodesFromDOM(editor, dom);

        const root = $getRoot();
        root.clear();

        // Filtrar apenas element nodes
        const elementNodes = nodes.filter(node =>
          node.__type === 'paragraph' ||
          node.__type === 'heading' ||
          node.__type === 'list' ||
          node.__type === 'listitem' ||
          node.__type === 'quote'
        );

        if (elementNodes.length > 0) {
          root.append(...elementNodes);
        }
      } catch (error) {
        console.error('[RichTextEditor] Error loading HTML:', error);
      }
    });
  }, [editor, html]);

  return null;
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Digite aqui...",
  minHeight = "200px"
}: RichTextEditorProps) {

  // IMPORTANTE: Criar editorState inicial com direção LTR forçada
  const initialEditorState = () => {
    const root = $getRoot();
    root.setDirection('ltr');
  };

  const initialConfig = {
    namespace: 'RichTextEditor',
    theme: editorTheme,
    onError,
    editorState: initialEditorState,
    nodes: [
      HeadingNode,
      QuoteNode,
      ListItemNode,
      ListNode,
      LinkNode,
    ],
  };

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor, null);
      onChange?.(htmlString);
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="relative border border-border rounded-lg overflow-hidden bg-background" dir="ltr" style={{ direction: 'ltr' }}>
        <ToolbarPlugin />
        <div className="relative" dir="ltr" style={{ direction: 'ltr' }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="outline-none px-4 py-3 prose prose-sm max-w-none"
                style={{ minHeight, direction: 'ltr', textAlign: 'left' }}
                dir="ltr"
                lang="pt-BR"
              />
            }
            placeholder={
              <div className="absolute top-3 left-4 text-muted-foreground pointer-events-none select-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <InitialContentPlugin html={value} />
        <OnChangePlugin onChange={handleChange} />
      </div>
    </LexicalComposer>
  );
}
