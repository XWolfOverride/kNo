import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  UserPlus, 
  Shield, 
  KeyRound, 
  Check, 
  X, 
  AlertCircle, 
  Power,
  RotateCcw,
  Trash2,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { api } from '../api';
import { User } from '../types';

interface AdminPanelProps {
  currentUser: User;
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser, onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New user modal/form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [createLoading, setCreateLoading] = useState(false);

  // Reset password state
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete user state
  const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err?.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      setError('Usuario y contraseña requeridos');
      return;
    }

    setCreateLoading(true);
    setError(null);
    try {
      const created = await api.createAdminUser({
        username: newUsername.trim(),
        password: newPassword.trim(),
        name: newName.trim() || newUsername.trim(),
        role: newRole,
      });
      setUsers((prev) => [...prev, created]);
      setIsCreateOpen(false);
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      setNewRole('user');
      setSuccessMsg(`Usuario @${created.username} creado correctamente`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setError(err?.message || 'Error al crear usuario');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (user.id === currentUser.id) return;
    const nextDisabled = !user.disabled;
    try {
      const updated = await api.setUserDisabledStatus(user.id, nextDisabled);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: any) {
      setError(err?.message || 'Error al modificar estado');
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser || !passwordInput.trim()) return;

    setPasswordLoading(true);
    try {
      await api.resetUserPassword(passwordModalUser.id, passwordInput.trim());
      setSuccessMsg(`Contraseña actualizada para @${passwordModalUser.username}`);
      setTimeout(() => setSuccessMsg(null), 3500);
      setPasswordModalUser(null);
      setPasswordInput('');
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar contraseña');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    setDeleteLoading(true);
    try {
      await api.deleteAdminUser(deleteModalUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteModalUser.id));
      setSuccessMsg(`Usuario @${deleteModalUser.username} eliminado correctamente`);
      setTimeout(() => setSuccessMsg(null), 3500);
      setDeleteModalUser(null);
    } catch (err: any) {
      setError(err?.message || 'Error al eliminar usuario');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleResetToSetup = async () => {
    if (window.confirm('¿Deseas reiniciar el sistema al estado inicial? Todos los usuarios serán eliminados y se abrirá el Asistente de Primer Uso (Setup) para crear un nuevo administrador.')) {
      try {
        await api.resetToSetup();
        window.location.reload();
      } catch (err: any) {
        setError(err?.message || 'Error al reiniciar');
      }
    }
  };

  const hasBootUser = users.some((u) => u.username === 'boot');

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

  return (
    <div className="flex-1 flex flex-col h-full bg-[#181c13] text-[#f5f6f0] overflow-hidden animate-in fade-in duration-150">
      {/* Top Bar */}
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
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#c85718]" />
            <span className="text-sm font-semibold text-white tracking-tight">
              Gestión de Usuarios
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#c85718] hover:bg-[#db641d] active:bg-[#af4710] text-white text-xs font-medium shadow-md shadow-black/40 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Alta manual</span>
        </button>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Notice for test user boot if present */}
        {hasBootUser && (
          <div className="p-3.5 rounded-xl bg-[#272113] text-xs text-[#e8b584] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#f59e64] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-[#f5c69b] block">
                  Usuario de prueba detectado: <code className="font-mono bg-black/40 px-1 rounded text-[#f59e64]">boot</code>
                </span>
                <span className="text-[11px] text-[#cca072]">
                  Crea tu usuario administrador definitivo y elimina <code className="font-mono">boot</code> antes de publicar.
                </span>
              </div>
            </div>
            {users.find((u) => u.username === 'boot') && users.find((u) => u.username === 'boot')?.id !== currentUser.id && (
              <button
                type="button"
                onClick={() => setDeleteModalUser(users.find((u) => u.username === 'boot') || null)}
                className="cursor-pointer text-xs px-3 py-1.5 rounded-full bg-[#3f2b18] hover:bg-[#52371e] text-[#f5c69b] font-medium shrink-0 self-start sm:self-auto transition-colors"
              >
                Eliminar usuario 'boot'
              </button>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="p-3.5 rounded-xl bg-[#14170f] text-xs text-[#8d9680] space-y-1 shadow-xs">
          <p className="font-medium text-white">
            Control de altas y accesos (sin autoregistro público)
          </p>
          <p className="text-[11px] text-[#717b66] leading-relaxed">
            Solo los administradores pueden añadir nuevos usuarios. Puedes deshabilitar cualquier cuenta para revocar temporalmente su acceso sin perder sus datos guardados, o eliminar usuarios permanentemente.
          </p>
        </div>

        {/* Users List - Soft surface without harsh border */}
        <div className="rounded-2xl bg-[#1a1e14] overflow-hidden divide-y divide-white/[0.04] shadow-xs">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#717b66] text-xs">
              <div className="w-5 h-5 border-2 border-[#c85718]/30 border-t-[#c85718] rounded-full animate-spin mb-2" />
              <span>Cargando usuarios...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#717b66]">
              No hay usuarios en la base de datos.
            </div>
          ) : (
            users.map((user) => {
              const isSelf = user.id === currentUser.id;
              const isDisabled = Boolean(user.disabled);

              return (
                <div
                  key={user.id}
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isDisabled ? 'bg-black/25 opacity-70' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  {/* User details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        user.role === 'admin'
                          ? 'bg-[#3b2011] text-[#f59e64]'
                          : 'bg-[#252b1b] text-[#d8decb]'
                      }`}
                    >
                      {user.username.slice(0, 1).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white truncate">
                          {user.name || user.username}
                        </span>
                        <span className="text-[11px] font-mono text-[#8d9680] truncate">
                          @{user.username}
                        </span>

                        {isSelf && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#2a3120] text-[#d8decb]">
                            tú
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span
                          className={`font-medium ${
                            user.role === 'admin' ? 'text-[#f59e64]' : 'text-[#8d9680]'
                          }`}
                        >
                          {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                        </span>
                        <span className="text-[#555d4b]">&bull;</span>
                        <span className="text-[#717b66] font-mono">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {/* Status Badge */}
                    <span
                      className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full ${
                        isDisabled
                          ? 'bg-rose-500/15 text-rose-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {isDisabled ? 'Deshabilitado' : 'Activo'}
                    </span>

                    {/* Reset Password Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordModalUser(user);
                        setPasswordInput('');
                      }}
                      className="p-1.5 text-[#8d9680] hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors text-xs flex items-center gap-1 cursor-pointer"
                      title="Asignar nueva contraseña"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle Status Button (Disable / Enable) */}
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => handleToggleStatus(user)}
                      className={`cursor-pointer px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                        isSelf
                          ? 'opacity-30 cursor-not-allowed bg-white/[0.03] text-[#717b66]'
                          : isDisabled
                          ? 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'
                          : 'bg-[#3b2713] text-[#f59e64] hover:bg-[#4d3218]'
                      }`}
                      title={
                        isSelf
                          ? 'No puedes deshabilitar tu propia cuenta'
                          : isDisabled
                          ? 'Habilitar acceso'
                          : 'Deshabilitar acceso'
                      }
                    >
                      <Power className="w-3 h-3" />
                      <span>{isDisabled ? 'Habilitar' : 'Deshabilitar'}</span>
                    </button>

                    {/* Delete User Button */}
                    <button
                      type="button"
                      disabled={isSelf}
                      onClick={() => setDeleteModalUser(user)}
                      className={`p-1.5 rounded-lg transition-colors text-xs flex items-center cursor-pointer ${
                        isSelf
                          ? 'opacity-25 cursor-not-allowed text-[#555d4b]'
                          : 'text-[#717b66] hover:text-rose-400 hover:bg-rose-500/10'
                      }`}
                      title={isSelf ? 'No puedes eliminar tu propia cuenta en sesión' : 'Eliminar usuario permanentemente'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* First-Run Bootstrap Setup Section (Option C) */}
        <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-[#1d2217] space-y-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#c85718] shrink-0" />
            <h3 className="text-xs font-semibold text-white">
              Mecanismo de Despliegue y Bootstrap (Opción C)
            </h3>
          </div>
          <p className="text-[11px] text-[#8d9680] leading-relaxed">
            La <strong>Opción C</strong> activa el <em>Asistente interactivo de primer uso (Setup Wizard)</em>: si la base de datos arranca sin usuarios, el sistema bloquea el login habitual y muestra la pantalla para registrar el Administrador Principal. Una vez completado, el registro se bloquea de forma definitiva.
          </p>
          <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-[11px] text-[#717b66]">
              ¿Quieres preparar la aplicación para una puesta en producción limpia?
            </div>
            <button
              type="button"
              onClick={handleResetToSetup}
              className="cursor-pointer px-4 py-1.5 rounded-full bg-[#3a1d17] hover:bg-[#4a241c] text-[#fca5a5] text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar a Asistente de Primer Uso</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create User */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#1a1e14] rounded-2xl w-full max-w-sm shadow-2xl shadow-black/80 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.04] mb-4">
              <div className="flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#c85718]" />
                <h3 className="text-sm font-semibold text-white">Alta Manual de Usuario</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-[#8d9680] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#8d9680] mb-1">
                  Usuario <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="ej. operador"
                  className="w-full px-3 py-1.5 bg-[#13160e] rounded-xl text-xs text-white placeholder-[#555d4b] focus:outline-none focus:ring-1 focus:ring-[#c85718] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8d9680] mb-1">
                  Nombre visible (opcional)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="ej. Juan Pérez"
                  className="w-full px-3 py-1.5 bg-[#13160e] rounded-xl text-xs text-white placeholder-[#555d4b] focus:outline-none focus:ring-1 focus:ring-[#c85718]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8d9680] mb-1">
                  Contraseña inicial <span className="text-amber-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-1.5 bg-[#13160e] rounded-xl text-xs text-white placeholder-[#555d4b] focus:outline-none focus:ring-1 focus:ring-[#c85718] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8d9680] mb-1">
                  Rol del usuario
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('user')}
                    className={`cursor-pointer py-1.5 px-3 rounded-xl text-xs font-medium text-center transition-colors ${
                      newRole === 'user'
                        ? 'bg-[#3b2011] text-[#f59e64] font-semibold'
                        : 'bg-[#13160e] text-[#8d9680] hover:text-white'
                    }`}
                  >
                    Usuario
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`cursor-pointer py-1.5 px-3 rounded-xl text-xs font-medium text-center transition-colors ${
                      newRole === 'admin'
                        ? 'bg-[#3b2011] text-[#f59e64] font-semibold'
                        : 'bg-[#13160e] text-[#8d9680] hover:text-white'
                    }`}
                  >
                    Administrador
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="cursor-pointer px-3.5 py-1.5 rounded-full text-xs text-[#8d9680] hover:text-white hover:bg-white/[0.05]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="cursor-pointer px-4 py-1.5 rounded-full bg-[#c85718] hover:bg-[#db641d] active:bg-[#af4710] text-white text-xs font-medium shadow-md shadow-black/40 disabled:opacity-50"
                >
                  {createLoading ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reset Password */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#1a1e14] rounded-2xl w-full max-w-sm shadow-2xl shadow-black/80 p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.04] mb-3">
              <h3 className="text-sm font-semibold text-white">Nueva contraseña</h3>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="text-[#8d9680] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8d9680] mb-3">
              Introduce la nueva contraseña para el usuario{' '}
              <strong className="text-[#f59e64] font-mono">@{passwordModalUser.username}</strong>:
            </p>

            <form onSubmit={handleSavePassword} className="space-y-3.5">
              <input
                type="password"
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full px-3 py-1.5 bg-[#13160e] rounded-xl text-xs text-white placeholder-[#555d4b] focus:outline-none focus:ring-1 focus:ring-[#c85718] font-mono"
              />

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="cursor-pointer px-3.5 py-1.5 rounded-full text-xs text-[#8d9680] hover:text-white hover:bg-white/[0.05]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="cursor-pointer px-4 py-1.5 rounded-full bg-[#c85718] hover:bg-[#db641d] active:bg-[#af4710] text-white text-xs font-medium shadow-md shadow-black/40 disabled:opacity-50"
                >
                  {passwordLoading ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete User Confirmation */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#1a1e14] rounded-2xl w-full max-w-sm shadow-2xl shadow-black/80 p-5 sm:p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04] mb-3 text-rose-400">
              <Trash2 className="w-4 h-4" />
              <h3 className="text-sm font-semibold text-white">Eliminar Usuario</h3>
            </div>

            <p className="text-xs text-[#d8decb] mb-2">
              ¿Estás seguro de que deseas eliminar permanentemente al usuario{' '}
              <strong className="text-rose-300 font-mono">@{deleteModalUser.username}</strong> ({deleteModalUser.name || deleteModalUser.username})?
            </p>
            <p className="text-[11px] text-[#717b66] mb-4">
              Esta acción no se puede deshacer y sus sesiones activas serán invalidadas inmediatamente.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="cursor-pointer px-3.5 py-1.5 rounded-full text-xs text-[#8d9680] hover:text-white hover:bg-white/[0.05]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteUser}
                className="cursor-pointer px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium shadow-md shadow-black/40 disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
