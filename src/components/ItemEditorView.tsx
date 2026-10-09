import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { Item, ItemUrl } from '../types';
import { parseCategoriesInput } from '../utils/categories';
import { ItemUrlsInput } from './ItemUrlsInput';
import { MarkdownEditor } from './MarkdownEditor';

interface ItemEditorViewProps {
  itemToEdit?: Item | null;
  onSave: (data: {
    title: string;
    categories: string;
    urls?: ItemUrl[];
    content?: string;
  }) => Promise<void>;
  onBack: () => void;
}

export const ItemEditorView: React.FC<ItemEditorViewProps> = ({
  itemToEdit,
  onSave,
  onBack,
}) => {
  const [title, setTitle] = useState('');
  const [categoriesInput, setCategoriesInput] = useState('');
  const [urls, setUrls] = useState<ItemUrl[]>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setTitle(itemToEdit.title);
      setCategoriesInput(itemToEdit.rawCategories || itemToEdit.categories.join(', '));
      setUrls(itemToEdit.urls ? [...itemToEdit.urls] : []);
      setContent(itemToEdit.content || itemToEdit.notes || '');
    } else {
      setTitle('');
      setCategoriesInput('retro, proyecto/hardware, tecnología');
      setUrls([]);
      setContent('');
    }
    setError(null);
  }, [itemToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Introduce un título para la cosa');
      return;
    }

    const parsed = parseCategoriesInput(categoriesInput);
    if (parsed.length === 0) {
      setError('Debes especificar al menos una categoría');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSave({
        title: title.trim(),
        categories: categoriesInput,
        urls: urls.filter((u) => u.url.trim() || u.description.trim()),
        content: content.trim(),
      });
      onBack();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const addPreset = (example: string) => {
    setCategoriesInput((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return example;
      if (trimmed.includes(example)) return trimmed;
      return `${trimmed}, ${example}`;
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181c13] text-[#f5f6f0] overflow-hidden animate-in fade-in duration-150">
      {/* Top App Bar */}
      <header className="h-13 px-3 sm:px-4 bg-[#1a1e14] flex items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-1 text-[#9fa691] hover:text-white rounded-full hover:bg-white/[0.05] transition-colors cursor-pointer"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white tracking-tight">
            {itemToEdit ? 'Editar cosa' : 'Nueva cosa'}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#c85718] hover:bg-[#db641d] active:bg-[#af4710] disabled:opacity-50 text-white text-xs font-medium shadow-md shadow-black/40 transition-colors"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>Guardar</span>
        </button>
      </header>

      {/* Editor Body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Título principal */}
        <div>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la cosa..."
            className="w-full py-1.5 bg-transparent border-0 border-b border-white/[0.06] focus:border-[#c85718] focus:ring-0 text-base sm:text-lg font-medium text-white placeholder-[#68705b] transition-colors"
          />
        </div>

        {/* 2. Categorías */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#9fa691]">
            <label className="font-medium text-white">Categorías</label>
            <span className="text-[11px] text-[#717b66] font-mono">ej: retro, proyecto/hardware</span>
          </div>
          <input
            type="text"
            required
            value={categoriesInput}
            onChange={(e) => setCategoriesInput(e.target.value)}
            placeholder="retro, proyecto/hardware, tecnología"
            className="w-full px-3 py-2 bg-[#13160e] rounded-xl text-xs font-mono text-[#f59e64] placeholder-[#555d4b] focus:outline-none focus:ring-1 focus:ring-[#c85718] transition-colors"
          />

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-[#717b66]">Añadir rápido:</span>
            <button
              type="button"
              onClick={() => addPreset('retro')}
              className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#24291a] hover:bg-[#2f3622] text-[#d8decb] transition-colors font-mono cursor-pointer"
            >
              + retro
            </button>
            <button
              type="button"
              onClick={() => addPreset('proyecto/hardware')}
              className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#24291a] hover:bg-[#2f3622] text-[#d8decb] transition-colors font-mono cursor-pointer"
            >
              + proyecto/hardware
            </button>
            <button
              type="button"
              onClick={() => addPreset('tecnología')}
              className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#24291a] hover:bg-[#2f3622] text-[#d8decb] transition-colors font-mono cursor-pointer"
            >
              + tecnología
            </button>
          </div>
        </div>

        {/* 3. URLs asociadas */}
        <div className="pt-1">
          <ItemUrlsInput urls={urls} onChange={setUrls} />
        </div>

        {/* 4. Contenido Markdown */}
        <div className="pt-1 space-y-1.5">
          <label className="block text-xs font-medium text-white">
            Contenido Markdown
          </label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Escribe el contenido en Markdown (soporta encabezados, código, listas, tablas...)"
            minHeight="220px"
          />
        </div>
      </form>
    </div>
  );
};
