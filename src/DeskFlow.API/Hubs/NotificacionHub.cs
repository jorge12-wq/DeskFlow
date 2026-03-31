using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace DeskFlow.API.Hubs;

[Authorize]
public class NotificacionHub : Hub
{
    private readonly INotificacionService _notificacionService;

    public NotificacionHub(INotificacionService notificacionService)
    {
        _notificacionService = notificacionService;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (Guid.TryParse(userId, out var uid))
        {
            var count = await _notificacionService.GetNoLeidasCountAsync(uid);
            await Clients.Caller.SendAsync("NoLeidasCount", count);
        }
        await base.OnConnectedAsync();
    }

    public async Task MarcarLeida(Guid notificacionId)
    {
        if (Guid.TryParse(Context.UserIdentifier, out var uid))
        {
            await _notificacionService.MarcarLeidaAsync(notificacionId, uid);
            var count = await _notificacionService.GetNoLeidasCountAsync(uid);
            await Clients.Caller.SendAsync("NoLeidasCount", count);
        }
    }
}
