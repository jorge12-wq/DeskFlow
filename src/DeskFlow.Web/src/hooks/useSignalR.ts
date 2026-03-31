import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';
import { useNotificacionesStore } from '../store/notificacionesStore';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Notificacion } from '../types';

const HUB_URL = (import.meta.env.VITE_API_URL || 'https://localhost:7000').replace('/api', '') + '/hubs/notificaciones';

export function useSignalR() {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const { accessToken, isAuthenticated } = useAuthStore();
  const { agregarNotificacion } = useNotificacionesStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => accessToken })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('NuevaNotificacion', (notif: Notificacion) => {
      agregarNotificacion(notif);
      toast(notif.titulo, { description: notif.mensaje });
    });

    // Invalidar dashboard y listas cuando hay cambios en tickets
    connection.on('TicketCreado', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes-count'] });
    });

    connection.on('TicketActualizado', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes-count'] });
    });

    connection.on('EstadoCambiado', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    });

    connection.on('TecnicoAsignado', () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes'] });
      queryClient.invalidateQueries({ queryKey: ['tickets-pendientes-count'] });
    });

    connection.start().catch(err => console.warn('SignalR connection failed:', err));
    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, [isAuthenticated, accessToken]);
}
