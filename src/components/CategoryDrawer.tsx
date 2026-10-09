import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  Tag, 
  X,
  Search,
  Check
} from 'lucide-react';
import { CategoryNode } from '../types';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryNode[];
  selectedCategory: string | null;
  onSelectCategory: (path: string | null) => void;
  totalItemsCount: number;
}

export const CategoryDrawer: React.FC<CategoryDrawerProps> = ({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  onSelectCategory,
  totalItemsCount,
}) => {
  const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const toggleExpand = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleSelect = (path: string | null) => {
    onSelectCategory(path);
    onClose();
  };

  const renderNode = (node: CategoryNode) => {
    const isSelected = selectedCategory?.toLowerCase() === node.path.toLowerCase();
    const hasChildren = node.children && node.children.length > 0;
    const isCollapsed = collapsedPaths.has(node.path);

    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchesSelf = node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q);
      const matchesDescendant = (children: CategoryNode[]): boolean =>
        children.some((c) => c.name.toLowerCase().includes(q) || c.path.toLowerCase().includes(q) || matchesDescendant(c.children));

      if (!matchesSelf && !matchesDescendant(node.children)) {
        return null;
      }
    }

    return (
      <div key={node.path} className="select-none">
        <div
          onClick={() => handleSelect(node.path)}
          style={{ paddingLeft: `${node.depth * 14 + 12}px` }}
          className={`flex items-center justify-between py-2 pr-3 my-0.5 rounded-r-full text-xs font-medium cursor-pointer transition-colors ${
            isSelected
              ? 'bg-[#3b2011] text-[#f59e64] font-semibold'
              : 'text-[#d8decb] hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.path, e)}
                className="p-0.5 text-[#869178] hover:text-white"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-3.5 inline-block text-center text-[#555d4c] font-mono text-[9px]">
                &bull;
              </span>
            )}

            {hasChildren ? (
              isCollapsed ? (
                <Folder className="w-3.5 h-3.5 shrink-0 text-[#c85718]/80" />
              ) : (
                <FolderOpen className="w-3.5 h-3.5 shrink-0 text-[#c85718]" />
              )
            ) : (
              <Tag className="w-3 h-3 shrink-0 text-[#869178]" />
            )}

            <span className="truncate">{node.name}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-[#4a2613] text-[#f5c69b]' : 'text-[#717b66]'
              }`}
            >
              {node.itemCount}
            </span>
            {isSelected && <Check className="w-3 h-3 text-[#c85718]" />}
          </div>
        </div>

        {hasChildren && !isCollapsed && (
          <div className="relative">
            <div
              className="absolute left-0 top-0 bottom-0 border-l border-white/[0.04] pointer-events-none"
              style={{ left: `${node.depth * 14 + 18}px` }}
            />
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-30 flex">
      {/* Semi-transparent scrim backdrop relative to application */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel on Left - Soft defined space */}
      <div className="relative z-10 w-72 max-w-[80%] h-full bg-[#1a1e14] flex flex-col shadow-2xl shadow-black/80 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="h-13 px-4 bg-[#1f2418] flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#c85718]" />
            <span className="text-sm font-semibold text-white tracking-tight">Categorías</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#9fa691] hover:text-white rounded-full hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search within tree */}
        <div className="p-2.5 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#717b66]" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar categoría..."
              className="w-full pl-8 pr-6 py-1 bg-[#13160e] rounded-lg text-xs text-white placeholder-[#717b66] focus:outline-none focus:ring-1 focus:ring-[#c85718] transition-colors"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="absolute right-2 top-1.5 text-[#717b66] hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Tree Content */}
        <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-0.5">
          {/* Todas las cosas */}
          <div
            onClick={() => handleSelect(null)}
            className={`flex items-center justify-between py-2 px-3 rounded-r-full text-xs font-medium cursor-pointer transition-colors ${
              selectedCategory === null
                ? 'bg-[#3b2011] text-[#f59e64] font-semibold'
                : 'text-[#d8decb] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#c85718]" />
              <span>Todas las cosas</span>
            </div>
            <span
              className={`text-[11px] font-mono px-2 py-0.2 rounded-full ${
                selectedCategory === null ? 'bg-[#4a2613] text-[#f5c69b]' : 'text-[#717b66]'
              }`}
            >
              {totalItemsCount}
            </span>
          </div>

          <div className="pt-2 pb-1 px-3 text-[10px] font-medium tracking-wider text-[#717b66] uppercase">
            Taxonomía
          </div>

          {categories.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#717b66] italic">
              No hay categorías aún.
            </div>
          ) : (
            categories.map((node) => renderNode(node))
          )}
        </div>

        {/* Footer info */}
        {selectedCategory && (
          <div className="p-3 bg-[#13160e] flex items-center justify-between text-xs shrink-0">
            <span className="text-[11px] text-[#9fa691] font-mono truncate pr-2">
              Filtro: <span className="text-[#f59e64]">{selectedCategory}</span>
            </span>
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="text-[11px] text-white px-2.5 py-1 rounded-full bg-[#27301c] hover:bg-[#344024] transition-colors cursor-pointer"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
