import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User, Mail, Shield, Edit3, Lock, Check, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const { usuario, updateUsuario } = useAuthStore();
  const [tab, setTab] = useState<'datos' | 'contrasena'>('datos');

  // ── Datos personales ──────────────────────────────────────
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [apellido, setApellido] = useState(usuario?.apellido ?? '');

  const datosMutation = useMutation({
    mutationFn: () => apiClient.put('/perfil', { nombre: nombre.trim(), apellido: apellido.trim() }).then(r => r.data),
    onSuccess: () => {
      updateUsuario({ nombre: nombre.trim(), apellido: apellido.trim() });
      setEditando(false);
      toast.success('Perfil actualizado');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const cancelarEdicion = () => {
    setNombre(usuario?.nombre ?? '');
    setApellido(usuario?.apellido ?? '');
    setEditando(false);
  };

  // ── Cambio de contraseña ──────────────────────────────────
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);

  const contrasenaError = contrasenaNueva && confirmar && contrasenaNueva !== confirmar
    ? 'Las contraseñas no coinciden'
    : contrasenaNueva && contrasenaNueva.length < 6
    ? 'Mínimo 6 caracteres'
    : '';

  const contrasenaMutation = useMutation({
    mutationFn: () => apiClient.post('/perfil/cambiar-contrasena', {
      contrasenaActual, contrasenaNueva,
    }),
    onSuccess: () => {
      setContrasenaActual(''); setContrasenaNueva(''); setConfirmar('');
      toast.success('Contraseña actualizada correctamente');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al cambiar la contraseña'),
  });

  const puedeGuardarContrasena = contrasenaActual && contrasenaNueva && confirmar
    && contrasenaNueva === confirmar && contrasenaNueva.length >= 6
    && !contrasenaMutation.isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>

      {/* Avatar + nombre */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {(usuario?.nombre?.[0] ?? '').toUpperCase()}{(usuario?.apellido?.[0] ?? '').toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{usuario?.nombre} {usuario?.apellido}</h2>
          <span className="text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{usuario?.rol}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('datos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === 'datos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <User className="h-4 w-4" /> Datos personales
        </button>
        <button
          onClick={() => setTab('contrasena')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
            tab === 'contrasena' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Lock className="h-4 w-4" /> Cambiar contraseña
        </button>
      </div>

      {/* ── Datos personales ── */}
      {tab === 'datos' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Información personal</h3>
            {!editando && (
              <button
                onClick={() => setEditando(true)}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition"
              >
                <Edit3 className="h-3.5 w-3.5" /> Editar
              </button>
            )}
          </div>

          {editando ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                  <input
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Apellido *</label>
                  <input
                    value={apellido}
                    onChange={e => setApellido(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={cancelarEdicion} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <X className="h-3.5 w-3.5" /> Cancelar
                </button>
                <button
                  onClick={() => datosMutation.mutate()}
                  disabled={!nombre.trim() || !apellido.trim() || datosMutation.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
                >
                  <Check className="h-3.5 w-3.5" /> {datosMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <InfoRow icon={<User className="h-4 w-4 text-gray-400" />} label="Nombre completo" value={`${usuario?.nombre} ${usuario?.apellido}`} />
              <InfoRow icon={<Mail className="h-4 w-4 text-gray-400" />} label="Email" value={usuario?.email ?? ''} />
              <InfoRow icon={<Shield className="h-4 w-4 text-gray-400" />} label="Rol" value={usuario?.rol ?? ''} />
            </div>
          )}
        </div>
      )}

      {/* ── Cambiar contraseña ── */}
      {tab === 'contrasena' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-gray-800">Cambiar contraseña</h3>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contraseña actual *</label>
            <div className="relative">
              <input
                type={showActual ? 'text' : 'password'}
                value={contrasenaActual}
                onChange={e => setContrasenaActual(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tu contraseña actual"
              />
              <button type="button" onClick={() => setShowActual(v => !v)} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                {showActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nueva contraseña *</label>
            <div className="relative">
              <input
                type={showNueva ? 'text' : 'password'}
                value={contrasenaNueva}
                onChange={e => setContrasenaNueva(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowNueva(v => !v)} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600">
                {showNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirmar nueva contraseña *</label>
            <input
              type="password"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                contrasenaError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              placeholder="Repetí la nueva contraseña"
            />
            {contrasenaError && <p className="text-red-500 text-xs mt-1">{contrasenaError}</p>}
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => contrasenaMutation.mutate()}
              disabled={!puedeGuardarContrasena}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
            >
              <Lock className="h-3.5 w-3.5" />
              {contrasenaMutation.isPending ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      {icon}
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
