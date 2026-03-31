namespace DeskFlow.Core.Interfaces;

public interface IFileStorageService
{
    Task<string> GuardarAsync(Stream stream, string nombreArchivo, string tipoArchivo,
        Guid tenantId, Guid ticketId);

    Task<Stream> ObtenerAsync(string rutaArchivo);
    Task EliminarAsync(string rutaArchivo);
    string GetContentType(string nombreArchivo);
}
