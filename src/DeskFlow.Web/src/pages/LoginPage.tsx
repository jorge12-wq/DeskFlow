import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Lock, Mail } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'Contrasena requerida'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const result = await authApi.login(data);
      setAuth(result.accessToken, result.refreshToken, result.usuario);
      navigate('/dashboard');
    } catch {
      setError('Credenciales invalidas. Verifica tu email y contrasena.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef4fb_100%)]" />
      <div className="absolute inset-0 opacity-60 df-dot-grid" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 shadow-[0_40px_120px_-48px_rgba(15,23,42,0.35)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden flex-col justify-between bg-[linear-gradient(160deg,#0f172a_0%,#172554_48%,#0f766e_100%)] p-10 text-white lg:flex">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-bold text-slate-900">
                DF
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-blue-100/70">Service Desk</p>
                <p className="text-lg font-semibold tracking-tight">DeskFlow</p>
              </div>
            </div>
            <h1 className="df-title max-w-md text-4xl font-semibold leading-tight">
              Gestion interna de servicios con una experiencia clara, moderna y profesional.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-blue-50/78">
              Centraliza solicitudes, seguimiento operativo, conocimiento y metricas en una sola plataforma preparada para crecer.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ['Mesa de ayuda', 'Tickets y SLA'],
              ['Autoservicio', 'Catalogo y portal'],
              ['Operacion', 'Cambios y problemas'],
            ].map(([title, subtitle]) => (
              <div key={title} className="rounded-2xl border border-white/12 bg-white/8 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-100/60">{title}</p>
                <p className="mt-2 text-sm font-medium text-white/92">{subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 p-8 sm:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(180deg,#1d4ed8,#0f172a)] text-2xl font-bold text-white shadow-[0_18px_40px_-22px_rgba(29,78,216,0.65)]">
                DF
              </div>
              <p className="df-kicker mb-3">Acceso seguro</p>
              <h1 className="df-title text-3xl font-semibold text-slate-950">Bienvenido a DeskFlow</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Inicia sesion para acceder a tus solicitudes, seguimiento operativo y herramientas de gestion.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="admin@demo.com"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Contrasena</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="Ingresa tu contrasena"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500"
                  />
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#1d4ed8,#0f172a)] py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-24px_rgba(29,78,216,0.7)] transition hover:translate-y-[-1px] hover:shadow-[0_24px_48px_-24px_rgba(15,23,42,0.45)] disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Ingresando...' : 'Ingresar al sistema'}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-xs text-slate-500">
              Acceso demo: <span className="font-semibold text-slate-700">admin@demo.com</span> /{' '}
              <span className="font-semibold text-slate-700">Admin123!</span>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Plataforma interna de gestion de servicios
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
