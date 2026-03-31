import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UsuarioInfo } from '../types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  usuario: UsuarioInfo | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, refreshToken: string, usuario: UsuarioInfo) => void;
  clearAuth: () => void;
  updateUsuario: (partial: Partial<UsuarioInfo>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      usuario: null,
      isAuthenticated: false,

      setAuth: (accessToken, refreshToken, usuario) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ accessToken, refreshToken, usuario, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ accessToken: null, refreshToken: null, usuario: null, isAuthenticated: false });
      },

      updateUsuario: (partial) =>
        set(state => ({ usuario: state.usuario ? { ...state.usuario, ...partial } : null })),
    }),
    {
      name: 'deskflow-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        usuario: state.usuario,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
