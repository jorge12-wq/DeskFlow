using DeskFlow.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DeskFlow.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private readonly ILogger<LocalFileStorageService> _logger;

    private static readonly HashSet<string> ExtensionesPermitidas =
    [
        ".jpg", ".jpeg", ".png", ".gif", ".pdf",
        ".doc", ".docx", ".xls", ".xlsx", ".txt", ".zip"
    ];

    private static readonly Dictionary<string, string> ContentTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".jpg",  "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".png",  "image/png" },
        { ".gif",  "image/gif" },
        { ".pdf",  "application/pdf" },
        { ".doc",  "application/msword" },
        { ".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        { ".xls",  "application/vnd.ms-excel" },
        { ".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
        { ".txt",  "text/plain" },
        { ".zip",  "application/zip" }
    };

    public LocalFileStorageService(IConfiguration config, ILogger<LocalFileStorageService> logger)
    {
        _basePath = config["FileStorage:LocalPath"] ?? Path.Combine(AppContext.BaseDirectory, "uploads");
        _logger = logger;
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> GuardarAsync(Stream stream, string nombreArchivo, string tipoArchivo,
        Guid tenantId, Guid ticketId)
    {
        var extension = Path.GetExtension(nombreArchivo).ToLowerInvariant();
        if (!ExtensionesPermitidas.Contains(extension))
            throw new InvalidOperationException($"Extensión no permitida: {extension}");

        var carpeta = Path.Combine(_basePath, tenantId.ToString(), ticketId.ToString());
        Directory.CreateDirectory(carpeta);

        var nombreGuardado = $"{Guid.NewGuid()}{extension}";
        var rutaCompleta = Path.Combine(carpeta, nombreGuardado);

        using var fileStream = new FileStream(rutaCompleta, FileMode.Create);
        await stream.CopyToAsync(fileStream);

        var rutaRelativa = Path.Combine(tenantId.ToString(), ticketId.ToString(), nombreGuardado)
            .Replace('\\', '/');

        _logger.LogInformation("Archivo guardado: {Ruta}", rutaRelativa);
        return rutaRelativa;
    }

    public Task<Stream> ObtenerAsync(string rutaArchivo)
    {
        var rutaCompleta = Path.Combine(_basePath, rutaArchivo.Replace('/', Path.DirectorySeparatorChar));
        if (!File.Exists(rutaCompleta))
            throw new FileNotFoundException("Archivo no encontrado.", rutaCompleta);

        Stream s = new FileStream(rutaCompleta, FileMode.Open, FileAccess.Read);
        return Task.FromResult(s);
    }

    public Task EliminarAsync(string rutaArchivo)
    {
        var rutaCompleta = Path.Combine(_basePath, rutaArchivo.Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(rutaCompleta))
        {
            File.Delete(rutaCompleta);
            _logger.LogInformation("Archivo eliminado: {Ruta}", rutaArchivo);
        }
        return Task.CompletedTask;
    }

    public string GetContentType(string nombreArchivo)
    {
        var ext = Path.GetExtension(nombreArchivo).ToLowerInvariant();
        return ContentTypes.GetValueOrDefault(ext, "application/octet-stream");
    }
}
