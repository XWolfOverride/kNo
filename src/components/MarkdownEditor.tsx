import React, { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Heading2, 
  Heading3, 
  Code, 
  FileCode, 
  List, 
  ListOrdered, 
  Quote, 
  Link as LinkIcon, 
  Table, 
  Eye, 
  Columns, 
  PenLine
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe aquí tu contenido en Markdown...',
  minHeight = '240px',
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormat = (prefix: string, suffix: string = '', defaultText: string = 'texto') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    const replacement = selectedText
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}${defaultText}${suffix}`;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = selectedText
        ? start + replacement.length
        : start + prefix.length + defaultText.length;
      textarea.setSelectionRange(
        selectedText ? start + prefix.length : newCursorPos,
        selectedText ? start + prefix.length + selectedText.length : newCursorPos
      );
    }, 0);
  };

  const applyLinePrefix = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const before = value.substring(0, lineStart);
    const after = value.substring(lineStart);

    const newValue = `${before}${prefix}${after}`;
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="rounded-xl overflow-hidden bg-[#13160e] flex flex-col focus-within:ring-1 focus-within:ring-[#c85718] transition-all shadow-xs">
      {/* Editor Top Bar: Toolbar & View Mode Switcher */}
      <div className="px-3 py-2 bg-[#1a1e14] flex flex-wrap items-center justify-between gap-2">
        {/* Formatting Buttons */}
        <div className="flex items-center gap-0.5 text-[#8d9680]">
          <button
            type="button"
            onClick={() => applyFormat('**', '**', 'negrita')}
            title="Negrita (**texto**)"
            className="p-1.5 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('*', '*', 'cursiva')}
            title="Cursiva (*texto*)"
            className="p-1.5 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-4 bg-white/[0.05] mx-1" />

          <button
            type="button"
            onClick={() => applyLinePrefix('## ')}
            title="Encabezado H2 (## Título)"
            className="p-1.5 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyLinePrefix('### ')}
            title="Encabezado H3 (### Subtítulo)"
            className="p-1.5 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-4 bg-white/[0.05] mx-1" />

          <button
            type="button"
            onClick={() => applyFormat('`', '`', 'código')}
            title="Código en línea (`código`)"
            className="p-1.5 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('```\n', '\n```', '// Código aquí')}
            title="Bloque de código (```...```)"
            className="p-1.5 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-4 bg-white/[0.05] mx-1" />

          <button
            type="button"
            onClick={() => applyLinePrefix('- ')}
            title="Lista con viñetas (- elemento)"
            className="p-1.5 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyLinePrefix('1. ')}
            title="Lista numerada (1. elemento)"
            className="p-1.5 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => applyLinePrefix('> ')}
            title="Cita (> texto)"
            className="p-1.5 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-4 bg-white/[0.05] mx-1" />

          <button
            type="button"
            onClick={() => applyFormat('[', '](https://enlace.com)', 'texto del enlace')}
            title="Insertar enlace [texto](url)"
            className="p-1.5 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() =>
              applyFormat(
                '\n| Columna 1 | Columna 2 |\n|-----------|-----------|\n| Dato A    | Dato B    |\n',
                ''
              )
            }
            title="Insertar tabla"
            className="p-1.5 hover:text-white hover:bg-white/[0.05] rounded transition-colors cursor-pointer"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-[#13160e] p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('edit')}
            className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'edit'
                ? 'bg-[#c85718] text-white shadow-xs'
                : 'text-[#8d9680] hover:text-white'
            }`}
          >
            <PenLine className="w-3 h-3" />
            <span>Editar</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'preview'
                ? 'bg-[#c85718] text-white shadow-xs'
                : 'text-[#8d9680] hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Vista previa</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`cursor-pointer hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              viewMode === 'split'
                ? 'bg-[#c85718] text-white shadow-xs'
                : 'text-[#8d9680] hover:text-white'
            }`}
          >
            <Columns className="w-3 h-3" />
            <span>Dividido</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="relative flex-1 flex" style={{ minHeight }}>
        {/* Textarea (Edit & Split mode) */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2 border-r border-white/[0.04]' : 'w-full'} flex flex-col`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              style={{ minHeight }}
              className="w-full flex-1 p-4 bg-transparent text-[#f5f6f0] font-mono text-xs sm:text-sm leading-relaxed placeholder-[#555d4b] focus:outline-none resize-y"
            />
          </div>
        )}

        {/* Live Preview (Preview & Split mode) */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={`${
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            } p-4 overflow-y-auto bg-[#161a10]`}
            style={{ minHeight }}
          >
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-[#68705b] italic text-xs">
                La vista previa del Markdown aparecerá aquí conforme escribas...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-3 py-1.5 bg-[#1a1e14] flex items-center justify-between text-[11px] text-[#717b66] font-mono">
        <div className="flex items-center gap-3">
          <span>{charCount} caracteres</span>
          <span>&bull;</span>
          <span>{wordCount} palabras</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <span>Markdown (GFM)</span>
        </div>
      </div>
    </div>
  );
};
