namespace DeskFlow.Core.Interfaces;

public interface IAsignacionService
{
    /// <summary>Asignación automática round-robin al técnico con menos tickets abiertos en la categoría.</summary>
    Task<Guid?> ObtenerTecnicoAutoAsync(Guid tenantId, Guid categoriaId);
}
