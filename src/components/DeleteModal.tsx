import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  itemTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading: boolean;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  itemTitle,
  onClose,
  onConfirm,
  loading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#1a1e14] rounded-2xl w-full max-w-sm shadow-2xl shadow-black/80 p-6">
        <div className="flex items-center gap-3 text-rose-400 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">¿Eliminar cosa?</h3>
            <p className="text-xs text-[#8d9680]">Esta acción no se puede deshacer.</p>
          </div>
        </div>

        <p className="text-xs text-[#f5f6f0] bg-[#13160e] p-3 rounded-xl font-mono mb-5 truncate shadow-inner">
          {itemTitle}
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="cursor-pointer px-3.5 py-1.5 rounded-full text-xs font-medium text-[#8d9680] hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-black/40 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
