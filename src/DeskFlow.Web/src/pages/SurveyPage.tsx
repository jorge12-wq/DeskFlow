import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, CheckCircle, ClipboardList } from 'lucide-react';
import { encuestasApi } from '../api/encuestas';
import { toast } from 'sonner';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`h-8 w-8 transition-colors ${(hovered || value) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function SurveyPage() {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, { puntuacion: number; comentario: string }>>({});
  const [enviadas, setEnviadas] = useState<Set<string>>(new Set());

  const { data: pendientes, isLoading } = useQuery({
    queryKey: ['encuestas-pendientes'],
    queryFn: encuestasApi.getPendientes,
  });

  const mutation = useMutation({
    mutationFn: encuestasApi.responder,
    onSuccess: (_, vars) => {
      setEnviadas(prev => new Set([...prev, vars.encuestaId]));
      queryClient.invalidateQueries({ queryKey: ['encuestas-pendientes'] });
      toast.success('¡Gracias por tu respuesta!');
    },
    onError: () => toast.error('Error al enviar la encuesta'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const pendientesFiltradas = pendientes?.filter(e => !enviadas.has(e.id)) ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Encuestas de Satisfacción</h1>
        <p className="text-gray-500 text-sm mt-1">Tu opinión nos ayuda a mejorar el servicio</p>
      </div>

      {pendientesFiltradas.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Todo al día!</h3>
          <p className="text-gray-500">No tenés encuestas pendientes por responder</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendientesFiltradas.map(encuesta => {
            const answer = answers[encuesta.id] ?? { puntuacion: 0, comentario: '' };
            return (
              <div key={encuesta.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <ClipboardList className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">{encuesta.ticketNumero} — {encuesta.ticketAsunto}</p>
                    {encuesta.tecnico && <p className="text-sm text-gray-500">Técnico: {encuesta.tecnico}</p>}
                  </div>
                </div>

                <p className="text-sm text-gray-700 mb-4 font-medium">{encuesta.pregunta}</p>

                <div className="mb-4">
                  <StarRating
                    value={answer.puntuacion}
                    onChange={v => setAnswers(prev => ({
                      ...prev,
                      [encuesta.id]: { ...prev[encuesta.id] ?? { comentario: '' }, puntuacion: v }
                    }))}
                  />
                  {answer.puntuacion > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {['', 'Muy insatisfecho', 'Insatisfecho', 'Neutral', 'Satisfecho', 'Muy satisfecho'][answer.puntuacion]}
                    </p>
                  )}
                </div>

                <textarea
                  value={answer.comentario}
                  onChange={e => setAnswers(prev => ({
                    ...prev,
                    [encuesta.id]: { ...prev[encuesta.id] ?? { puntuacion: 0 }, comentario: e.target.value }
                  }))}
                  placeholder="Comentario opcional..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                />

                <button
                  onClick={() => mutation.mutate({ encuestaId: encuesta.id, puntuacion: answer.puntuacion, comentario: answer.comentario || undefined })}
                  disabled={answer.puntuacion === 0 || mutation.isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-2 rounded-lg text-sm font-medium transition"
                >
                  Enviar evaluación
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
