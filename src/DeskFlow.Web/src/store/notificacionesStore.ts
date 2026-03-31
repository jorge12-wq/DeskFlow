import { create } from 'zustand';
import type { Notificacion } from '../types';

interface NotificacionesState {
  notificaciones: Notificacion[];
  noLeidas: number;
  setNotificaciones: (notifs: Notificacion[]) => void;
  agregarNotificacion: (notif: Notificacion) => void;
  marcarLeida: (id: string) => void;
  marcarTodasLeidas: () => void;
}

export const useNotificacionesStore = create<NotificacionesState>((set) => ({
  notificaciones: [],
  noLeidas: 0,

  setNotificaciones: (notifs) => set({
    notificaciones: notifs,
    noLeidas: notifs.filter(n => !n.leida).length,
  }),

  agregarNotificacion: (notif) => set(state => ({
    notificaciones: [notif, ...state.notificaciones],
    noLeidas: state.noLeidas + (notif.leida ? 0 : 1),
  })),

  marcarLeida: (id) => set(state => ({
    notificaciones: state.notificaciones.map(n => n.id === id ? { ...n, leida: true } : n),
    noLeidas: Math.max(0, state.noLeidas - (state.notificaciones.find(n => n.id === id && !n.leida) ? 1 : 0)),
  })),

  marcarTodasLeidas: () => set(state => ({
    notificaciones: state.notificaciones.map(n => ({ ...n, leida: true })),
    noLeidas: 0,
  })),
}));
