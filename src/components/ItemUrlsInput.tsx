import React from 'react';
import { Plus, Trash2, Link2 } from 'lucide-react';
import { ItemUrl } from '../types';

interface ItemUrlsInputProps {
  urls: ItemUrl[];
  onChange: (urls: ItemUrl[]) => void;
}

export const ItemUrlsInput: React.FC<ItemUrlsInputProps> = ({ urls, onChange }) => {
  const handleAddUrl = () => {
    onChange([
      ...urls,
      {
        id: `url_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: '',
        description: '',
      },
    ]);
  };

  const handleUpdate = (index: number, field: 'url' | 'description', value: string) => {
    const updated = [...urls];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleRemove = (index: number) => {
    const updated = urls.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-[#c85718]" />
          <span>URLs y enlaces asociados</span>
        </label>
        <button
          type="button"
          onClick={handleAddUrl}
          className="cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium text-[#e5722b] hover:text-[#f58d46] transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>+ Añadir enlace</span>
        </button>
      </div>

      {urls.length === 0 ? (
        <div className="p-3 rounded-xl bg-[#13160e] text-center shadow-xs">
          <p className="text-[11px] text-[#78816c] mb-2">
            Sin enlaces asociados. Puedes agregar URLs con su título antes del contenido.
          </p>
          <button
            type="button"
            onClick={handleAddUrl}
            className="cursor-pointer inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#24291a] hover:bg-[#2f3622] text-[11px] font-medium text-white transition-colors"
          >
            <Plus className="w-3 h-3 text-[#c85718]" />
            <span>Añadir enlace</span>
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {urls.map((u, idx) => (
            <div
              key={u.id || idx}
              className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#13160e] shadow-xs"
            >
              {/* Row: Input Título + Input Enlace + Botón Borrar */}
              <input
                type="text"
                value={u.description}
                onChange={(e) => handleUpdate(idx, 'description', e.target.value)}
                placeholder="Título del enlace (ej. Repositorio)"
                className="w-2/5 min-w-[110px] px-2.5 py-1.5 bg-[#1a1e14] rounded-lg text-xs text-white placeholder-[#68705b] focus:outline-none focus:ring-1 focus:ring-[#c85718] transition-colors"
              />

              <input
                type="url"
                value={u.url}
                onChange={(e) => handleUpdate(idx, 'url', e.target.value)}
                placeholder="https://..."
                className="flex-1 min-w-[130px] px-2.5 py-1.5 bg-[#1a1e14] rounded-lg text-xs text-[#f59e64] font-mono placeholder-[#68705b] focus:outline-none focus:ring-1 focus:ring-[#c85718] transition-colors"
              />

              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 text-[#78816c] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                title="Borrar enlace"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
