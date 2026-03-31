using DeskFlow.Core.DTOs.Notificaciones;

namespace DeskFlow.Core.Interfaces;

/// <summary>Abstracción para enviar notificaciones push en tiempo real (SignalR).</summary>
public interface INotificacionPushService
{
    Task PushAsync(Guid usuarioId, NotificacionDto dto);
}
