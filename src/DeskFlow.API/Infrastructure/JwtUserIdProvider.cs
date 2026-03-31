using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace DeskFlow.API.Infrastructure;

/// <summary>
/// Provee el UserId para SignalR usando el claim "sub" (UsuarioId del JWT).
/// Necesario para IHubContext.Clients.User(userId).
/// </summary>
public class JwtUserIdProvider : IUserIdProvider
{
    public string? GetUserId(HubConnectionContext connection)
    {
        return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? connection.User?.FindFirst("sub")?.Value;
    }
}
