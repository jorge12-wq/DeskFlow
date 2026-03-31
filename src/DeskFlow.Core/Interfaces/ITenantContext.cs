namespace DeskFlow.Core.Interfaces;

public interface ITenantContext
{
    Guid TenantId { get; }
    Guid UsuarioId { get; }
    string RolNombre { get; }
}
