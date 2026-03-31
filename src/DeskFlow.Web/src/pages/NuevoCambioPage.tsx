import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, GitMerge } from 'lucide-react';
import { cambiosApi } from '../api/cambios';
import { catalogosApi } from '../api/dashboard';

const RIESGO_OPTS = ['Bajo', 'Medio', 'Alto', 'Crítico'];
const IMPACTO_OPTS = ['Bajo', 'Medio', 'Alto'];
const URGENCIA_OPTS = ['Baja', 'Media', 'Alta'];

export default function NuevoCambioPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    tipoCambioId: '',
    prioridadId: '',
    categoriaId: '',
    implementadorId: '',
    riesgo: 'Bajo',
    impacto: 'Bajo',
    urgencia: 'Baja',
    descripcionImpacto: '',
    planImplementacion: '',
    planPruebas: '',
    planBackout: '',
    fechaInicioPlaneado: '',
    fechaFinPlaneado: '',
  });

  const [step, setStep] = useState<1 | 2>(1);

  const { data: tipos = [] } = useQuery({ queryKey: ['cambios-tipos'], queryFn: cambiosApi.getTipos });
  const { data: prioridades = [] } = useQuery({ queryKey: ['prioridades'], queryFn: catalogosApi.getPrioridades });
  const { data: categorias = [] } = useQuery({ queryKey: ['categorias'], queryFn: catalogosApi.getCategorias });

  const crearMutation = useMutation({
    mutationFn: () => cambiosApi.create({
      ...form,
      categoriaId: form.categoriaId || undefined,
      implementadorId: form.implementadorId || undefined,
      fechaInicioPlaneado: form.fechaInicioPlaneado ? new Date(form.fechaInicioPlaneado).toISOString() : undefined,
      fechaFinPlaneado: form.fechaFinPlaneado ? new Date(form.fechaFinPlaneado).toISOString() : undefined,
    }),
    onSuccess: data => navigate(`/cambios/${data.id}`),
  });

  const validStep1 = form.titulo.trim() && form.descripcion.trim() && form.tipoCambioId && form.prioridadId;
  const valid = validStep1;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/cambios')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft size={14} /> Volver a cambios
      </button>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-2">
          <GitMerge className="text-purple-500" size={20} />
          <h1 className="text-lg font-bold text-gray-900">Nuevo RFC — Request for Change</h1>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2">
          {[1, 2].map(s => (
            <button key={s} onClick={() => s === 2 && validStep1 && setStep(2) || s === 1 && setStep(1)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                step === s ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:text-gray-600'
              }`}>
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                step === s ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{s}</span>
              {s === 1 ? 'Información básica' : 'Planes técnicos'}
            </button>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input value={form.titulo} onChange={set('titulo')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Descripción breve del cambio" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
              <textarea value={form.descripcion} onChange={set('descripcion')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3} placeholder="Describí qué se va a cambiar y por qué..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de cambio *</label>
                <select value={form.tipoCambioId} onChange={set('tipoCambioId')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Seleccioná...</option>
                  {tipos.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad *</label>
                <select value={form.prioridadId} onChange={set('prioridadId')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Seleccioná...</option>
                  {prioridades.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Riesgo *</label>
                <select value={form.riesgo} onChange={set('riesgo')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {RIESGO_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Impacto *</label>
                <select value={form.impacto} onChange={set('impacto')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {IMPACTO_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Urgencia *</label>
                <select value={form.urgencia} onChange={set('urgencia')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  {URGENCIA_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del impacto</label>
              <textarea value={form.descripcionImpacto} onChange={set('descripcionImpacto')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={2} placeholder="¿A quiénes afecta? ¿Qué servicios estarán impactados?" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inicio planeado</label>
                <input type="datetime-local" value={form.fechaInicioPlaneado} onChange={set('fechaInicioPlaneado')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fin planeado</label>
                <input type="datetime-local" value={form.fechaFinPlaneado} onChange={set('fechaFinPlaneado')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select value={form.categoriaId} onChange={set('categoriaId')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Sin categoría</option>
                  {categorias.map((c: any) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} disabled={!validStep1}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
                Siguiente → Planes técnicos
              </button>
              <button onClick={() => crearMutation.mutate()} disabled={!valid || crearMutation.isPending}
                className="px-4 py-2 border border-purple-300 text-purple-700 rounded-lg text-sm hover:bg-purple-50 disabled:opacity-50 transition-colors">
                {crearMutation.isPending ? 'Creando...' : 'Guardar borrador'}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan de implementación</label>
              <textarea value={form.planImplementacion} onChange={set('planImplementacion')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={4} placeholder="Paso a paso de cómo se va a implementar el cambio..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan de pruebas</label>
              <textarea value={form.planPruebas} onChange={set('planPruebas')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3} placeholder="Cómo se va a verificar que el cambio fue exitoso..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 text-red-600">Plan de Backout (Rollback) *</label>
              <textarea value={form.planBackout} onChange={set('planBackout')}
                className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none bg-red-50"
                rows={3} placeholder="¿Cómo se revierte el cambio si algo sale mal?" />
              <p className="text-xs text-red-500 mt-1">Siempre definí un plan de rollback antes de implementar.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => crearMutation.mutate()} disabled={!valid || crearMutation.isPending}
                className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
                {crearMutation.isPending ? 'Creando...' : 'Crear RFC'}
              </button>
              <button onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-600 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                ← Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
