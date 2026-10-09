import React, { useState } from 'react';
import { LogIn, KeyRound, User as UserIcon, AlertCircle, Lock } from 'lucide-react';
import { BrainBulbIcon } from './BrainBulbIcon';
import { api } from '../api';
import { User } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor introduce usuario y contraseña');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.login(username, password);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[#13160e] text-[#f5f6f0]">
      <div className="w-full max-w-sm">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#22281a] text-[#c85718] mb-3 shadow-lg shadow-black/40">
            <BrainBulbIcon className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-['JetBrains_Mono',monospace]">
            k<span className="text-[#c85718]">No</span>
          </h1>
          <p className="mt-1 text-xs text-[#9fa691]">
            Almacén estructurado de conocimiento y taxonomía
          </p>
        </div>

        {/* Login Card - Soft elevated space without high-contrast border */}
        <div className="bg-[#1a1e14] rounded-2xl p-6 sm:p-7 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.04]">
            <Lock className="w-4 h-4 text-[#c85718]" />
            <h2 className="text-sm font-semibold text-white">Inicio de Sesión</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#9fa691] mb-1.5">
                Nombre de usuario
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
                  placeholder="Usuario"
                  className="w-full pl-9 pr-3 py-2 bg-[#13160e] rounded-xl text-xs text-white placeholder-[#68705b] focus:outline-none focus:ring-1 focus:ring-[#c85718] transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#9fa691] mb-1.5">
                Contraseña
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-full bg-[#c85718] hover:bg-[#db641d] active:bg-[#af4710] disabled:opacity-50 text-white font-medium text-xs transition-colors shadow-md shadow-black/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Acceder</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-[#808973]">
            Acceso restringido a cuentas autorizadas por el administrador.
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-[#6b735c] font-mono">
          kNo &bull; Almacén de Conocimiento
        </p>
      </div>
    </div>
  );
};
