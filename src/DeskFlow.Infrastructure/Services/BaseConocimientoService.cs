using System.Text.Json;
using DeskFlow.Core.DTOs.Conocimiento;
using DeskFlow.Core.DTOs.Tickets;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.Infrastructure.Services;

public class BaseConocimientoService : IBaseConocimientoService
{
    private readonly DeskFlowDbContext _context;
    private readonly ITenantContext _tenant;

    public BaseConocimientoService(DeskFlowDbContext context, ITenantContext tenant)
    {
        _context = context;
        _tenant = tenant;
    }

    public async Task<PagedResultDto<ArticuloListItemDto>> BuscarAsync(string? buscar, Guid? categoriaId, int pagina, int porPagina)
    {
        var query = _context.BaseConocimiento
            .Where(b => b.Activo)
            .Include(b => b.Categoria)
            .Include(b => b.Subcategoria)
            .Include(b => b.Autor)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var lower = buscar.ToLower();
            query = query.Where(b =>
                b.Titulo.ToLower().Contains(lower) ||
                b.Contenido.ToLower().Contains(lower) ||
                (b.Etiquetas != null && b.Etiquetas.ToLower().Contains(lower)));
        }

        if (categoriaId.HasValue)
            query = query.Where(b => b.CategoriaId == categoriaId.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(b => b.FechaActualizacion)
            .Skip((pagina - 1) * porPagina)
            .Take(porPagina)
            .ToListAsync();

        return new PagedResultDto<ArticuloListItemDto>
        {
            Items = items.Select(MapToListItem),
            Total = total,
            Page = pagina,
            PageSize = porPagina
        };
    }

    public async Task<ArticuloDto> GetByIdAsync(Guid id)
    {
        var articulo = await _context.BaseConocimiento
            .Include(b => b.Categoria)
            .Include(b => b.Subcategoria)
            .Include(b => b.Autor)
            .Include(b => b.Adjuntos)
            .FirstOrDefaultAsync(b => b.Id == id && b.Activo)
            ?? throw new KeyNotFoundException($"Artículo {id} no encontrado.");

        articulo.Vistas++;
        await _context.SaveChangesAsync();

        return MapToDto(articulo);
    }

    public async Task<IEnumerable<ArticuloListItemDto>> GetPopularesAsync()
    {
        var items = await _context.BaseConocimiento
            .Where(b => b.Activo)
            .Include(b => b.Categoria)
            .Include(b => b.Subcategoria)
            .Include(b => b.Autor)
            .OrderByDescending(b => b.Vistas)
            .Take(10)
            .ToListAsync();

        return items.Select(MapToListItem);
    }

    public async Task<IEnumerable<ArticuloListItemDto>> GetRelacionadosAsync(Guid id)
    {
        var relacionados = await _context.ArticulosRelacionados
            .Where(ar => ar.ArticuloOrigenId == id)
            .Include(ar => ar.Articulo)
                .ThenInclude(b => b.Categoria)
            .Include(ar => ar.Articulo)
                .ThenInclude(b => b.Autor)
            .Where(ar => ar.Articulo.Activo)
            .ToListAsync();

        return relacionados.Select(ar => MapToListItem(ar.Articulo));
    }

    public async Task<IEnumerable<ArticuloListItemDto>> SugerirPorTicketAsync(Guid ticketId)
    {
        var ticket = await _context.Tickets
            .FirstOrDefaultAsync(t => t.Id == ticketId)
            ?? throw new KeyNotFoundException($"Ticket {ticketId} no encontrado.");

        var items = await _context.BaseConocimiento
            .Where(b => b.Activo && b.CategoriaId == ticket.CategoriaId &&
                (ticket.SubcategoriaId == null || b.SubcategoriaId == ticket.SubcategoriaId))
            .Include(b => b.Categoria)
            .Include(b => b.Autor)
            .OrderByDescending(b => b.Vistas)
            .Take(5)
            .ToListAsync();

        return items.Select(MapToListItem);
    }

    public async Task<ArticuloDto> CreateAsync(CreateArticuloDto dto)
    {
        var articulo = new BaseConocimiento
        {
            TenantId = _tenant.TenantId,
            Titulo = dto.Titulo,
            Contenido = dto.Contenido,
            CategoriaId = dto.CategoriaId,
            SubcategoriaId = dto.SubcategoriaId,
            Etiquetas = dto.Etiquetas.Count > 0 ? JsonSerializer.Serialize(dto.Etiquetas) : null,
            AutorId = _tenant.UsuarioId,
            EsPublico = dto.EsPublico,
            FechaCreacion = DateTime.UtcNow,
            FechaActualizacion = DateTime.UtcNow
        };

        _context.BaseConocimiento.Add(articulo);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(articulo.Id);
    }

    public async Task<ArticuloDto> UpdateAsync(Guid id, UpdateArticuloDto dto)
    {
        var articulo = await _context.BaseConocimiento.FindAsync(id)
            ?? throw new KeyNotFoundException($"Artículo {id} no encontrado.");

        if (dto.Titulo != null) articulo.Titulo = dto.Titulo;
        if (dto.Contenido != null) articulo.Contenido = dto.Contenido;
        if (dto.CategoriaId.HasValue) articulo.CategoriaId = dto.CategoriaId.Value;
        if (dto.SubcategoriaId.HasValue) articulo.SubcategoriaId = dto.SubcategoriaId;
        if (dto.Etiquetas != null) articulo.Etiquetas = dto.Etiquetas.Count > 0 ? JsonSerializer.Serialize(dto.Etiquetas) : null;
        if (dto.EsPublico.HasValue) articulo.EsPublico = dto.EsPublico.Value;
        articulo.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var articulo = await _context.BaseConocimiento.FindAsync(id)
            ?? throw new KeyNotFoundException($"Artículo {id} no encontrado.");
        articulo.Activo = false;
        await _context.SaveChangesAsync();
    }

    public async Task<AdjuntoArticuloDto> AddAdjuntoAsync(Guid articuloId, string nombreOriginal, string rutaAlmacenada, string contentType, long tamanoBytes)
    {
        var adjunto = new ConocimientoAdjunto
        {
            TenantId = _tenant.TenantId,
            ArticuloId = articuloId,
            NombreOriginal = nombreOriginal,
            RutaAlmacenada = rutaAlmacenada,
            ContentType = contentType,
            TamanoBytes = tamanoBytes,
            FechaCreacion = DateTime.UtcNow
        };

        _context.ConocimientoAdjuntos.Add(adjunto);
        await _context.SaveChangesAsync();

        return new AdjuntoArticuloDto
        {
            Id = adjunto.Id,
            NombreOriginal = adjunto.NombreOriginal,
            ContentType = adjunto.ContentType,
            TamanoBytes = adjunto.TamanoBytes,
            FechaCreacion = adjunto.FechaCreacion
        };
    }

    public async Task<(string RutaAlmacenada, string NombreOriginal, string ContentType)> GetAdjuntoAsync(Guid adjuntoId)
    {
        var adjunto = await _context.ConocimientoAdjuntos.FindAsync(adjuntoId)
            ?? throw new KeyNotFoundException($"Adjunto {adjuntoId} no encontrado.");
        return (adjunto.RutaAlmacenada, adjunto.NombreOriginal, adjunto.ContentType);
    }

    public async Task DeleteAdjuntoAsync(Guid adjuntoId)
    {
        var adjunto = await _context.ConocimientoAdjuntos.FindAsync(adjuntoId)
            ?? throw new KeyNotFoundException($"Adjunto {adjuntoId} no encontrado.");
        _context.ConocimientoAdjuntos.Remove(adjunto);
        await _context.SaveChangesAsync();
    }

    private static ArticuloListItemDto MapToListItem(BaseConocimiento b) => new()
    {
        Id = b.Id,
        Titulo = b.Titulo,
        Categoria = b.Categoria?.Nombre ?? "",
        Subcategoria = b.Subcategoria?.Nombre,
        Etiquetas = b.Etiquetas != null
            ? JsonSerializer.Deserialize<List<string>>(b.Etiquetas) ?? new()
            : new(),
        Autor = b.Autor != null ? $"{b.Autor.Nombre} {b.Autor.Apellido}" : "",
        Vistas = b.Vistas,
        FechaCreacion = b.FechaCreacion,
        FechaActualizacion = b.FechaActualizacion
    };

    private static ArticuloDto MapToDto(BaseConocimiento b) => new()
    {
        Id = b.Id,
        Titulo = b.Titulo,
        Contenido = b.Contenido,
        Categoria = b.Categoria?.Nombre ?? "",
        CategoriaId = b.CategoriaId,
        Subcategoria = b.Subcategoria?.Nombre,
        SubcategoriaId = b.SubcategoriaId,
        Etiquetas = b.Etiquetas != null
            ? JsonSerializer.Deserialize<List<string>>(b.Etiquetas) ?? new()
            : new(),
        Autor = b.Autor != null ? $"{b.Autor.Nombre} {b.Autor.Apellido}" : "",
        AutorId = b.AutorId,
        Vistas = b.Vistas,
        EsPublico = b.EsPublico,
        FechaCreacion = b.FechaCreacion,
        FechaActualizacion = b.FechaActualizacion,
        Adjuntos = b.Adjuntos?.Select(a => new AdjuntoArticuloDto
        {
            Id = a.Id,
            NombreOriginal = a.NombreOriginal,
            ContentType = a.ContentType,
            TamanoBytes = a.TamanoBytes,
            FechaCreacion = a.FechaCreacion
        }).ToList() ?? new()
    };
}
