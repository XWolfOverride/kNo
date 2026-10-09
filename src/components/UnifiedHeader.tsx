import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Layers, 
  ChevronDown, 
  X, 
  LogOut, 
  Download,
  Shield
} from 'lucide-react';
import { BrainBulbIcon } from './BrainBulbIcon';
import { User } from '../types';

interface UnifiedHeaderProps {
  user: User;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string | null;
  onOpenCategories: () => void;
  onOpenCreateModal: () => void;
  onOpenAdmin?: () => void;
  onLogout: () => void;
}

export const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({
  user,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onOpenCategories,
  onOpenCreateModal,
  onOpenAdmin,
  onLogout,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <header className="h-13 bg-[#1a1e14] px-3 sm:px-4 flex items-center justify-between gap-2 shrink-0 z-20 shadow-md shadow-black/30">
      {/* 1. Left: Brand & Category Drawer Trigger */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenCategories}
          className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selectedCategory
              ? 'bg-[#3b2011] text-[#f59e64] font-semibold'
              : 'text-[#9fa691] hover:text-white hover:bg-white/[0.05]'
          }`}
          title="Abrir categorías"
        >
          <Layers className="w-4 h-4 text-[#c85718] shrink-0" />
          <span className="max-w-[85px] sm:max-w-[120px] truncate font-mono text-[11px]">
            {selectedCategory ? selectedCategory : 'Categorías'}
          </span>
          <ChevronDown className="w-3 h-3 text-[#9fa691] shrink-0" />
        </button>

        <div className="hidden xs:flex items-center gap-1 pl-1">
          <BrainBulbIcon className="w-4 h-4 text-[#c85718] shrink-0" />
          <span className="font-bold tracking-tight text-white font-['JetBrains_Mono',monospace] text-xs">
            k<span className="text-[#c85718]">No</span>
          </span>
        </div>
      </div>

      {/* 2. Middle: Search Input */}
      <div className="flex-1 max-w-sm mx-1">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#717b66]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar en kNo..."
            className="w-full pl-8 pr-7 py-1.5 bg-[#14170f] hover:bg-[#181c12] focus:bg-[#181c12] rounded-full text-xs text-white placeholder-[#717b66] focus:outline-none transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#717b66] hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Right: Add button + PWA install (if available) + User/Logout */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* PWA Install Button */}
        {deferredPrompt && (
          <button
            type="button"
            onClick={handleInstallClick}
            className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#27301c] text-[#b6d183] hover:bg-[#313c24] text-xs font-medium transition-colors"
            title="Instalar kNo como aplicación de escritorio o móvil"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline text-[11px]">Instalar</span>
          </button>
        )}

        {/* Admin Management button for admins */}
        {user.role === 'admin' && onOpenAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="cursor-pointer p-1.5 text-[#c85718] hover:text-[#e07534] rounded-full hover:bg-white/[0.05] transition-colors"
            title="Panel de Administración de Usuarios"
          >
            <Shield className="w-4 h-4" />
          </button>
        )}

        {/* Add item button in strong dark reddish-yellow */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="cursor-pointer inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#c85718] hover:bg-[#db641d] active:bg-[#b04710] text-white text-xs font-medium shadow-md shadow-black/40 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nueva</span>
        </button>

        {/* User initials & logout */}
        <div className="flex items-center gap-1 pl-1.5">
          <span
            className="w-6 h-6 rounded-full bg-[#282f1f] text-[10px] font-mono text-[#f5f6f0] flex items-center justify-center font-bold"
            title={`Usuario: ${user.username}`}
          >
            {user.username.slice(0, 1).toUpperCase()}
          </span>

          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-1.5 text-[#9fa691] hover:text-rose-400 rounded-full hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
