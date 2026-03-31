import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, BarChart3, Users, FileSpreadsheet, Loader2 } from 'lucide-react';
import { reportesApi, descargarArchivo } from '../api/reportes';
import { catalogosApi } from '../api/dashboard';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [ticketFiltros, setTicketFiltros] = useState({ fechaDesde: '', fechaHasta: '', estado: '', tecnicoId: '' });
  const [tecnicoFiltros, setTecnicoFiltros] = useState({ fechaDesde: '', fechaHasta: '' });
  const [slaFiltro, setSlaFiltro] = useState({ mes: new Date().getMonth() + 1, anio: new Date().getFullYear() });
  const [ticketPdfId, setTicketPdfId] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const { data: tecnicos } = useQuery({ queryKey: ['tecnicos'], queryFn: catalogosApi.getTecnicos });

  const descargar = async (tipo: string, fn: () => Promise<Blob>, nombre: string) => {
    setLoading(tipo);
    try {
      const blob = await fn();
      descargarArchivo(blob, nombre);
      toast.success('Reporte descargado');
    } catch {
      toast.error('Error al generar el reporte');
    } finally {
      setLoading(null);
    }
  };

  const now = new Date();
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Generá y descargá reportes del sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reporte tickets */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Reporte de Tickets</h3>
              <p className="text-xs text-gray-500">Excel con detalle y resumen</p>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desde</label>
                <input type="date" value={ticketFiltros.fechaDesde}
                  onChange={e => setTicketFiltros(f => ({ ...f, fechaDesde: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                <input type="date" value={ticketFiltros.fechaHasta}
                  onChange={e => setTicketFiltros(f => ({ ...f, fechaHasta: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <select value={ticketFiltros.tecnicoId}
              onChange={e => setTicketFiltros(f => ({ ...f, tecnicoId: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los técnicos</option>
              {tecnicos?.map(t => <option key={t.id} value={t.id}>{t.nombreCompleto}</option>)}
            </select>
          </div>
          <button
            onClick={() => descargar('tickets', () => reportesApi.ticketsExcel(ticketFiltros), `tickets_${Date.now()}.xlsx`)}
            disabled={loading === 'tickets'}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            {loading === 'tickets' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Descargar Excel
          </button>
        </div>

        {/* Reporte SLA */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Reporte de SLA</h3>
              <p className="text-xs text-gray-500">Cumplimiento por mes</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mes</label>
              <select value={slaFiltro.mes}
                onChange={e => setSlaFiltro(f => ({ ...f, mes: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {meses.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Año</label>
              <select value={slaFiltro.anio}
                onChange={e => setSlaFiltro(f => ({ ...f, anio: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[now.getFullYear() - 1, now.getFullYear()].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={() => descargar('sla', () => reportesApi.slaExcel(slaFiltro.mes, slaFiltro.anio), `sla_${slaFiltro.anio}_${slaFiltro.mes}.xlsx`)}
            disabled={loading === 'sla'}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            {loading === 'sla' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Descargar Excel
          </button>
        </div>

        {/* Reporte técnicos */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Rendimiento de Técnicos</h3>
              <p className="text-xs text-gray-500">Métricas por técnico</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Desde</label>
              <input type="date" value={tecnicoFiltros.fechaDesde}
                onChange={e => setTecnicoFiltros(f => ({ ...f, fechaDesde: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hasta</label>
              <input type="date" value={tecnicoFiltros.fechaHasta}
                onChange={e => setTecnicoFiltros(f => ({ ...f, fechaHasta: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <button
            onClick={() => descargar('tecnicos', () => reportesApi.tecnicosExcel(tecnicoFiltros), `tecnicos_${Date.now()}.xlsx`)}
            disabled={loading === 'tecnicos'}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            {loading === 'tecnicos' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Descargar Excel
          </button>
        </div>

        {/* Reporte individual PDF */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Reporte Individual (PDF)</h3>
              <p className="text-xs text-gray-500">PDF completo de un ticket</p>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">ID del Ticket</label>
            <input
              value={ticketPdfId}
              onChange={e => setTicketPdfId(e.target.value)}
              placeholder="Pegá el ID del ticket..."
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => ticketPdfId && descargar('pdf', () => reportesApi.ticketPdf(ticketPdfId), `ticket_${ticketPdfId}.pdf`)}
            disabled={loading === 'pdf' || !ticketPdfId}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition"
          >
            {loading === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
