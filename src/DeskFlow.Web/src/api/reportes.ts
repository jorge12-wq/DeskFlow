import apiClient from './client';

export const reportesApi = {
  ticketsExcel: (params: { fechaDesde?: string; fechaHasta?: string; estado?: string; tecnicoId?: string }) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && p.set(k, v));
    return apiClient.get(`/reportes/tickets/excel?${p}`, { responseType: 'blob' }).then(r => r.data as Blob);
  },

  slaExcel: (mes: number, anio: number) =>
    apiClient.get(`/reportes/sla/excel?mes=${mes}&anio=${anio}`, { responseType: 'blob' }).then(r => r.data as Blob),

  tecnicosExcel: (params: { fechaDesde?: string; fechaHasta?: string }) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && p.set(k, v));
    return apiClient.get(`/reportes/tecnicos/excel?${p}`, { responseType: 'blob' }).then(r => r.data as Blob);
  },

  ticketPdf: (id: string) =>
    apiClient.get(`/reportes/ticket/${id}/pdf`, { responseType: 'blob' }).then(r => r.data as Blob),
};

export function descargarArchivo(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
