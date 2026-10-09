import React, { useState } from 'react';
import { 
  Trash2, 
  Edit3, 
  Clock, 
  Inbox, 
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { Item } from '../types';
import { ItemUrlsDisplay } from './ItemUrlsDisplay';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ItemListProps {
  items: Item[];
  loading: boolean;
  selectedCategory: string | null;
  searchQuery: string;
  onSelectCategory: (path: string | null) => void;
  onClearSearch: () => void;
  onEditItem: (item: Item) => void;
  onDeleteItem: (id: string, title: string) => void;
  onOpenCreateModal: () => void;
}

export const ItemList: React.FC<ItemListProps> = ({
  items,
  loading,
  selectedCategory,
  searchQuery,
  onSelectCategory,
  onClearSearch,
  onEditItem,
  onDeleteItem,
  onOpenCreateModal,
}) => {
  // Track expanded state for long markdown content per item
  const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(new Set());

  const toggleExpandItem = (id: string) => {
    setExpandedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);
    } catch {
      return '';
    }
  };

  const hasActiveFilters = Boolean(selectedCategory || searchQuery);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#181c13]">
      {/* Subtle compact filter banner if filtered */}
      {hasActiveFilters && (
        <div className="px-3.5 py-1.5 bg-[#1d2217] flex items-center justify-between text-xs text-[#9fa691] font-mono shrink-0 shadow-xs">
          <div className="flex items-center gap-1.5 truncate">
            {selectedCategory && (
              <span className="flex items-center gap-1 text-[#f59e64]">
                <span className="text-[#78816c] font-sans">categoría:</span>
                <span className="font-semibold truncate">{selectedCategory}</span>
              </span>
            )}
            {selectedCategory && searchQuery && <span className="text-[#555d4b]">&bull;</span>}
            {searchQuery && (
              <span className="text-white truncate">
                &quot;{searchQuery}&quot;
              </span>
            )}
            <span className="text-[#555d4b]">&bull;</span>
            <span className="text-[#78816c]">
              {items.length} {items.length === 1 ? 'cosa' : 'cosas'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2">
            {searchQuery && (
              <button
                onClick={onClearSearch}
                className="hover:text-white underline text-[11px] text-[#9fa691] font-sans cursor-pointer"
              >
                quitar búsqueda
              </button>
            )}
            {selectedCategory && (
              <button
                onClick={() => onSelectCategory(null)}
                className="hover:text-white underline text-[11px] text-[#9fa691] font-sans cursor-pointer"
              >
                todas
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area - Soft divider-based list without harsh border boxes */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-[#78816c]">
            <div className="w-5 h-5 border-2 border-[#c85718]/30 border-t-[#c85718] rounded-full animate-spin mb-2" />
            <span className="text-xs">Cargando...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-[#22281a] flex items-center justify-center text-[#c85718] mb-3 shadow-md shadow-black/40">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-semibold text-white">
              {searchQuery
                ? 'Sin resultados para la búsqueda'
                : selectedCategory
                ? `Sin cosas en "${selectedCategory}"`
                : 'No hay cosas guardadas'}
            </h3>
            <p className="mt-1 text-xs text-[#8d9680] max-w-xs">
              {searchQuery || selectedCategory
                ? 'Intenta restablecer el filtro o buscar con otro término.'
                : 'Crea tu primera cosa con categorías anidadas y Markdown.'}
            </p>
            <div className="mt-4 flex gap-2">
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    onClearSearch();
                    onSelectCategory(null);
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#27301c] hover:bg-[#344024] text-xs text-white transition-colors cursor-pointer"
                >
                  Ver todas
                </button>
              )}
              <button
                onClick={onOpenCreateModal}
                className="cursor-pointer px-4 py-1.5 rounded-full bg-[#c85718] hover:bg-[#db641d] text-white text-xs font-medium shadow-md shadow-black/40 transition-colors"
              >
                + Nueva cosa
              </button>
            </div>
          </div>
        ) : (
          items.map((item) => {
            const hasUrls = item.urls && item.urls.length > 0;
            const content = item.content || item.notes || '';
            const isLongContent = content.length > 300 || (content.match(/\n/g) || []).length > 4;
            const isExpanded = expandedItemIds.has(item.id) || !isLongContent;

            return (
              <div
                key={item.id}
                className="py-4 px-3.5 sm:px-5 hover:bg-white/[0.02] transition-colors"
              >
                {/* Header: Title and Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white tracking-tight leading-snug">
                      {item.title}
                    </h3>

                    {/* Category Tags - Simple, clean unboxed tags with # */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {item.categories.map((catPath) => {
                        const isCurrentActive =
                          selectedCategory &&
                          (selectedCategory.toLowerCase() === catPath.toLowerCase() ||
                            catPath.toLowerCase().startsWith(selectedCategory.toLowerCase() + '/'));

                        return (
                          <button
                            key={catPath}
                            type="button"
                            onClick={() => onSelectCategory(catPath)}
                            title={`Filtrar por "${catPath}"`}
                            className={`group inline-flex items-center text-[11px] font-mono transition-colors cursor-pointer ${
                              isCurrentActive
                                ? 'text-[#f59e64] font-semibold underline underline-offset-2'
                                : 'text-[#8d9680] hover:text-[#f59e64]'
                            }`}
                          >
                            <span className="text-[#555d4b] mr-0.5 group-hover:text-[#c85718]">#</span>
                            <span>{catPath}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions: Edit and Delete */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onEditItem(item)}
                      title="Editar cosa"
                      className="p-1.5 text-[#8d9680] hover:text-white rounded-full hover:bg-white/[0.05] transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id, item.title)}
                      title="Borrar cosa"
                      className="p-1.5 text-[#8d9680] hover:text-rose-400 rounded-full hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* URLs antes del contenido */}
                {hasUrls && (
                  <div className="mt-2.5">
                    <ItemUrlsDisplay urls={item.urls!} />
                  </div>
                )}

                {/* Contenido Markdown */}
                {content && (
                  <div className="mt-2.5">
                    <div className="relative">
                      <div
                        className={`overflow-hidden transition-all ${
                          !isExpanded ? 'max-h-32' : ''
                        }`}
                      >
                        <MarkdownRenderer content={content} />
                      </div>

                      {!isExpanded && (
                        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#181c13] via-[#181c13]/85 to-transparent pointer-events-none" />
                      )}
                    </div>

                    {isLongContent && (
                      <div className="mt-1">
                        <button
                          type="button"
                          onClick={() => toggleExpandItem(item.id)}
                          className="cursor-pointer inline-flex items-center gap-1 text-[#e5722b] hover:text-[#f58d46] text-[11px] font-medium transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              <span>Colapsar</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              <span>Leer todo</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Compact Footer */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-[#717b66]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#555d4b]" />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  {content && (
                    <div className="flex items-center gap-1 text-[#555d4b] font-mono text-[10px]">
                      <FileText className="w-3 h-3" />
                      <span>markdown</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
