using DeskFlow.API.Hubs;
using DeskFlow.Core.DTOs.Notificaciones;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace DeskFlow.API.Services;

public class SignalRNotificacionPushService : INotificacionPushService
{
    private readonly IHubContext<NotificacionHub> _hub;

    public SignalRNotificacionPushService(IHubContext<NotificacionHub> hub)
    {
        _hub = hub;
    }

    public Task PushAsync(Guid usuarioId, NotificacionDto dto)
        => _hub.Clients.User(usuarioId.ToString()).SendAsync("NuevaNotificacion", dto);
}
