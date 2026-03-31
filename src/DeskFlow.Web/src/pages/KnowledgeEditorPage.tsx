import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Save, Paperclip, X, Upload, FileText } from 'lucide-react';
import { conocimientoApi } from '../api/conocimiento';
import { catalogosApi } from '../api/dashboard';
import { toast } from 'sonner';
import { useEffect, useRef, useState } from 'react';
import type { AdjuntoArticulo } from '../types';

const schema = z.object({
  titulo: z.string().min(5, 'Mínimo 5 caracteres'),
  contenido: z.string().min(10, 'Contenido requerido'),
  categoriaId: z.string().min(1, 'Seleccioná una categoría'),
  subcategoriaId: z.string().optional(),
  esPublico: z.boolean(),
});

type FormData = z.infer<typeof schema>;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const [etiquetas, setEtiquetas] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [adjuntos, setAdjuntos] = useState<AdjuntoArticulo[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: articulo } = useQuery({
    queryKey: ['articulo', id],
    queryFn: () => conocimientoApi.getById(id!),
    enabled: isEditing,
  });

  const { data: categorias } = useQuery({
    queryKey: ['categorias'],
    queryFn: catalogosApi.getCategorias,
  });

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { esPublico: true },
  });

  const categoriaId = watch('categoriaId');
  const selectedCategoria = categorias?.find(c => c.id === categoriaId);

  useEffect(() => {
    if (articulo) {
      reset({
        titulo: articulo.titulo,
        contenido: articulo.contenido,
        categoriaId: articulo.categoriaId,
        subcategoriaId: articulo.subcategoriaId,
        esPublico: articulo.esPublico,
      });
      setEtiquetas(articulo.etiquetas);
      setAdjuntos(articulo.adjuntos ?? []);
    }
  }, [articulo]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) => conocimientoApi.create({ ...data, etiquetas }),
    onSuccess: (result) => { toast.success('Artículo creado'); navigate(`/conocimiento/${result.id}`); },
    onError: () => toast.error('Error al crear el artículo'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => conocimientoApi.update(id!, { ...data, etiquetas }),
    onSuccess: () => { toast.success('Artículo actualizado'); navigate(`/conocimiento/${id}`); },
    onError: () => toast.error('Error al actualizar el artículo'),
  });

  const deleteAdjuntoMutation = useMutation({
    mutationFn: (adjuntoId: string) => conocimientoApi.deleteAdjunto(id!, adjuntoId),
    onSuccess: (_, adjuntoId) => {
      setAdjuntos(prev => prev.filter(a => a.id !== adjuntoId));
      queryClient.invalidateQueries({ queryKey: ['articulo', id] });
    },
    onError: () => toast.error('Error al eliminar el adjunto'),
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !etiquetas.includes(tag)) {
      setEtiquetas(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!id) {
      toast.error('Guardá el artículo primero para poder adjuntar archivos.');
      return;
    }
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} supera los 20 MB.`);
        continue;
      }
      setUploadingFiles(prev => [...prev, file.name]);
      try {
        const adjunto = await conocimientoApi.uploadAdjunto(id, file);
        setAdjuntos(prev => [...prev, adjunto]);
        queryClient.invalidateQueries({ queryKey: ['articulo', id] });
        toast.success(`${file.name} adjuntado`);
      } catch {
        toast.error(`Error al subir ${file.name}`);
      } finally {
        setUploadingFiles(prev => prev.filter(n => n !== file.name));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">
          {isEditing ? 'Editar artículo' : 'Nuevo artículo'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {/* Título */}
        <div>
          <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Título *</label>
          <input {...register('titulo')}
            placeholder="Título del artículo"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
          />
          {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>}
        </div>

        {/* Categoría y Subcategoría */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Categoría *</label>
            <select {...register('categoriaId')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition">
              <option value="">Seleccionar...</option>
              {categorias?.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            {errors.categoriaId && <p className="text-red-500 text-xs mt-1">{errors.categoriaId.message}</p>}
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subcategoría</label>
            <select {...register('subcategoriaId')} disabled={!categoriaId}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition disabled:opacity-50">
              <option value="">Ninguna</option>
              {selectedCategoria?.subcategorias.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        </div>

        {/* Contenido */}
        <div>
          <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Contenido *</label>
          <textarea {...register('contenido')} rows={12}
            placeholder="Escribí el contenido del artículo (HTML permitido)..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-y bg-gray-50 focus:bg-white transition"
          />
          {errors.contenido && <p className="text-red-500 text-xs mt-1">{errors.contenido.message}</p>}
        </div>

        {/* Etiquetas */}
        <div>
          <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Etiquetas</label>
          <div className="flex gap-2 mb-2">
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Agregar etiqueta..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition"
            />
            <button type="button" onClick={addTag}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition">
              Agregar
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {etiquetas.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {tag}
                <button type="button" onClick={() => setEtiquetas(prev => prev.filter(t => t !== tag))}
                  className="hover:text-red-500 transition">×</button>
              </span>
            ))}
          </div>
        </div>

        {/* Adjuntos */}
        <div>
          <label className="block text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            <Paperclip className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
            Archivos adjuntos
          </label>

          {!isEditing && (
            <p className="text-[12px] text-gray-400 italic mb-2">Guardá el artículo primero para adjuntar archivos.</p>
          )}

          {isEditing && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-[13px] text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 transition w-full justify-center mb-3"
              >
                <Upload className="h-4 w-4" />
                Seleccionar archivos (máx. 20 MB)
              </button>
            </>
          )}

          {/* Lista de adjuntos */}
          {(adjuntos.length > 0 || uploadingFiles.length > 0) && (
            <div className="space-y-1.5">
              {adjuntos.map(a => (
                <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                  <a
                    href={conocimientoApi.getAdjuntoUrl(id!, a.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-[13px] text-blue-600 hover:underline truncate"
                  >
                    {a.nombreOriginal}
                  </a>
                  <span className="text-[11px] text-gray-400 shrink-0">{formatBytes(a.tamanoBytes)}</span>
                  <button
                    type="button"
                    onClick={() => deleteAdjuntoMutation.mutate(a.id)}
                    disabled={deleteAdjuntoMutation.isPending}
                    className="p-1 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 transition shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {uploadingFiles.map(name => (
                <div key={name} className="flex items-center gap-2.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
                  <span className="flex-1 text-[13px] text-blue-600 truncate">{name}</span>
                  <span className="text-[11px] text-blue-400">Subiendo...</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Público */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('esPublico')} className="rounded" />
          <span className="text-sm text-gray-700">Artículo público (visible para todos los usuarios)</span>
        </label>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          <button type="button" onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="submit" disabled={isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isPending ? 'Guardando...' : 'Guardar artículo'}
          </button>
        </div>
      </form>
    </div>
  );
}
