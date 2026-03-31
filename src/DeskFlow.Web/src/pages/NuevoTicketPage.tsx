import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { ticketsApi } from '../api/tickets';
import { catalogosApi } from '../api/dashboard';

const schema = z.object({
  asunto: z.string().min(5, 'Mínimo 5 caracteres'),
  descripcion: z.string().min(10, 'Mínimo 10 caracteres'),
  categoriaId: z.string().min(1, 'Seleccioná una categoría'),
  subcategoriaId: z.string().optional(),
  prioridadId: z.string().min(1, 'Seleccioná una prioridad'),
  sucursalId: z.string().optional(),
  areaId: z.string().min(1, 'Seleccioná un área'),
});

type FormData = z.infer<typeof schema>;

export default function NuevoTicketPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const helpDeskId = searchParams.get('helpDeskId') ?? undefined;
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: catalogosApi.getCategorias });
  const { data: prioridades } = useQuery({ queryKey: ['prioridades'], queryFn: catalogosApi.getPrioridades });
  const { data: sucursales } = useQuery({ queryKey: ['sucursales'], queryFn: catalogosApi.getSucursales });
  const { data: areas } = useQuery({ queryKey: ['areas'], queryFn: catalogosApi.getAreas });

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Auto-select the area linked to the help desk from the URL param
  useEffect(() => {
    if (helpDeskId && areas) {
      const matchingArea = areas.find(a => a.helpDeskId === helpDeskId);
      if (matchingArea) setValue('areaId', matchingArea.id);
    }
  }, [helpDeskId, areas, setValue]);

  const categoriaId = watch('categoriaId');
  const selectedCategoria = categorias?.find(c => c.id === categoriaId);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const selectedArea = areas?.find(a => a.id === data.areaId);
      const resolvedHelpDeskId = selectedArea?.helpDeskId ?? helpDeskId;
      return ticketsApi.create({
        ...data,
        // Convert empty strings to undefined — ASP.NET Core cannot parse "" as Guid?
        subcategoriaId: data.subcategoriaId || undefined,
        sucursalId: data.sucursalId || undefined,
        helpDeskId: resolvedHelpDeskId,
      });
    },
    onSuccess: (ticket) => navigate(`/tickets/${ticket.id}`),
  });

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition text-gray-800";
  const labelCls = "block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/tickets')} className="p-1.5 rounded-lg hover:bg-gray-200 transition text-gray-500">
          <ArrowLeft className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Nuevo Ticket</h1>
          <p className="text-[13px] text-gray-500">Completá el formulario para crear un ticket</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* Asunto */}
        <div>
          <label className={labelCls}>Asunto <span className="text-red-500 normal-case tracking-normal">*</span></label>
          <input
            {...register('asunto')}
            placeholder="Descripción breve del problema"
            className={inputCls}
          />
          {errors.asunto && <p className="text-red-500 text-[12px] mt-1">{errors.asunto.message}</p>}
        </div>

        {/* Descripcion */}
        <div>
          <label className={labelCls}>Descripción <span className="text-red-500 normal-case tracking-normal">*</span></label>
          <textarea
            {...register('descripcion')}
            rows={4}
            placeholder="Describí el problema con el mayor detalle posible..."
            className={`${inputCls} resize-none`}
          />
          {errors.descripcion && <p className="text-red-500 text-[12px] mt-1">{errors.descripcion.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Categoria */}
          <div>
            <label className={labelCls}>Categoría <span className="text-red-500 normal-case tracking-normal">*</span></label>
            <select {...register('categoriaId')} className={inputCls}>
              <option value="">Seleccionar...</option>
              {categorias?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {errors.categoriaId && <p className="text-red-500 text-[12px] mt-1">{errors.categoriaId.message}</p>}
          </div>

          {/* Subcategoria */}
          <div>
            <label className={labelCls}>Subcategoría</label>
            <select
              {...register('subcategoriaId')}
              disabled={!categoriaId}
              className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <option value="">Seleccionar...</option>
              {selectedCategoria?.subcategorias.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          {/* Prioridad */}
          <div>
            <label className={labelCls}>Prioridad <span className="text-red-500 normal-case tracking-normal">*</span></label>
            <select {...register('prioridadId')} className={inputCls}>
              <option value="">Seleccionar...</option>
              {prioridades?.map(p => <option key={p.id} value={p.id}>{p.nombre} (SLA: {p.tiempoResolucionSLA_Horas}h)</option>)}
            </select>
            {errors.prioridadId && <p className="text-red-500 text-[12px] mt-1">{errors.prioridadId.message}</p>}
          </div>

          {/* Sucursal */}
          <div>
            <label className={labelCls}>Sucursal</label>
            <select {...register('sucursalId')} className={inputCls}>
              <option value="">Sin especificar</option>
              {sucursales?.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          {/* Area */}
          <div>
            <label className={labelCls}>Área <span className="text-red-500 normal-case tracking-normal">*</span></label>
            <select {...register('areaId')} className={inputCls}>
              <option value="">Seleccionar...</option>
              {areas?.filter(a => a.helpDeskId).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
            {errors.areaId && <p className="text-red-500 text-[12px] mt-1">{errors.areaId.message}</p>}
          </div>
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-[13px]">
            Error al crear el ticket. Intentá de nuevo.
          </div>
        )}

        <div className="flex gap-3 pt-1 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/tickets')}
            className="flex-1 px-4 py-2 mt-3 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 mt-3 rounded-lg text-[13px] font-medium transition flex items-center justify-center gap-2 shadow-sm"
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {mutation.isPending ? 'Creando...' : 'Crear Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
