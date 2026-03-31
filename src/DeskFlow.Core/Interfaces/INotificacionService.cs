using DeskFlow.Core.DTOs.Notificaciones;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Enums;

namespace DeskFlow.Core.Interfaces;

public interface INotificacionService
{
    Task NotificarAsync(Guid tenantId, Guid usuarioId, string titulo, string mensaje,
        TipoNotificacion tipo, Guid? ticketId = null);

    Task NotificarMultiplesAsync(Guid tenantId, IEnumerable<Guid> usuarioIds, string titulo,
        string mensaje, TipoNotificacion tipo, Guid? ticketId = null);

    Task<IEnumerable<NotificacionDto>> GetByUsuarioAsync(Guid usuarioId);
    Task MarcarLeidaAsync(Guid id, Guid usuarioId);
    Task MarcarTodasLeidasAsync(Guid usuarioId);
    Task<int> GetNoLeidasCountAsync(Guid usuarioId);
}
