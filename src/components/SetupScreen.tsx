import React, { useState } from 'react';
import { ShieldCheck, KeyRound, User as UserIcon, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { BrainBulbIcon } from './BrainBulbIcon';
import { api } from '../api';
import { User } from '../types';

interface SetupScreenProps {
  onSetupComplete: (user: User) => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete }) => {
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim().toLowerCase();
    if (cleanUser.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await api.setupInitialAdmin({
        username: cleanUser,
        password,
        name: name.trim() || cleanUser,
      });
      onSetupComplete(res.user);
    } catch (err: any) {
      setError(err?.message || 'Error al inicializar el administrador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-[#13160e] text-[#f5f6f0]">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#22281a] text-[#c85718] mb-3 shadow-lg shadow-black/40">
            <BrainBulbIcon className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['JetBrains_Mono',monospace]">
            k<span className="text-[#c85718]">No</span>
          </h1>
          <p className="mt-1 text-xs text-[#9fa691]">
            Asistente de Primer Uso &bull; Almacén de Conocimiento
          </p>
        </div>

        {/* Setup Card - Soft elevated space without high-contrast border */}
        <div className="bg-[#1a1e14] rounded-2xl p-5 sm:p-6 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.04]">
            <ShieldCheck className="w-4 h-4 text-[#c85718]" />
            <h2 className="text-sm font-semibold text-white">Crear Administrador Principal</h2>
          </div>

          {/* Security Notice */}
          <div className="mb-4 p-3.5 rounded-xl bg-[#241f14] text-xs text-[#e8b584] leading-relaxed">
            <span className="font-semibold text-[#f5c69b] block mb-0.5">
              Inicialización única del sistema
            </span>
            No se han detectado usuarios en la base de datos. Crea tu cuenta administradora para comenzar. Esta pantalla se bloqueará permanentemente tras completarse.
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#9fa691] mb-1">
                Usuario administrador <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6e7661]">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. admin"
                  className="w-full pl-9 pr-3 py-2 bg-[#13160e] rounded-xl text-xs text-white placeholder-[#68705b] focus:outline-none focus:ring-1 focus:ring-[#c85718] transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9fa691] mb-1">
                Nombre visible (opcional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej. Administrador Principal"
                className="w-full px-3 py-2 bg-[#13160e] rounded-xl text-xs text-white placeholder-[#68705b] focus:outline-none focus:ring-1 focus:ring-[#c85718] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9fa691] mb-1">
                Contraseña <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6e7661]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-[#13160e] rounded-xl text-xs text-white placeholder-[#68705b] focus:outline-none focus:ring-1 focus:ring-[#c85718] transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9fa691] mb-1">
                Confirmar contraseña <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6e7661]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-[#13160e] rounded-xl text-xs text-white placeholder-[#68705b] focus:outline-none focus:ring-1 focus:ring-[#c85718] transition-colors font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-full bg-[#c85718] hover:bg-[#db641d] active:bg-[#af4710] disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-md shadow-black/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Inicializar y Acceder</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#6b735c] font-mono">
          kNo &bull; Almacén de Conocimiento
        </p>
      </div>
    </div>
  );
};
