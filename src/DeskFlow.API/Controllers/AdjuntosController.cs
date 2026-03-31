using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/tickets/{ticketId:guid}/adjuntos")]
[Authorize]
public class AdjuntosController : ControllerBase
{
    private readonly DeskFlowDbContext _context;
    private readonly IFileStorageService _storage;
    private readonly ITenantContext _tenantContext;

    public AdjuntosController(DeskFlowDbContext context, IFileStorageService storage,
        ITenantContext tenantContext)
    {
        _context = context;
        _storage = storage;
        _tenantContext = tenantContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetAdjuntos(Guid ticketId)
    {
        var adjuntos = await _context.AdjuntosTicket
            .Where(a => a.TicketId == ticketId)
            .OrderByDescending(a => a.FechaCreacion)
            .Select(a => new
            {
                a.Id,
                a.NombreArchivo,
                a.TipoArchivo,
                a.Tamaño,
                a.FechaCreacion
            })
            .ToListAsync();

        return Ok(adjuntos);
    }

    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB
    public async Task<IActionResult> SubirAdjunto(Guid ticketId, IFormFile archivo)
    {
        if (archivo == null || archivo.Length == 0)
            return BadRequest("No se proporcionó ningún archivo.");

        var ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null)
            return NotFound("Ticket no encontrado.");

        using var stream = archivo.OpenReadStream();
        var ruta = await _storage.GuardarAsync(stream, archivo.FileName,
            archivo.ContentType, _tenantContext.TenantId, ticketId);

        var adjunto = new AdjuntoTicket
        {
            TicketId = ticketId,
            NombreArchivo = archivo.FileName,
            RutaArchivo = ruta,
            TipoArchivo = archivo.ContentType,
            Tamaño = archivo.Length,
            FechaCreacion = DateTime.UtcNow
        };

        await _context.AdjuntosTicket.AddAsync(adjunto);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            adjunto.Id,
            adjunto.NombreArchivo,
            adjunto.TipoArchivo,
            adjunto.Tamaño,
            adjunto.FechaCreacion
        });
    }

    [HttpGet("{adjuntoId:guid}/descargar")]
    public async Task<IActionResult> Descargar(Guid ticketId, Guid adjuntoId)
    {
        var adjunto = await _context.AdjuntosTicket
            .FirstOrDefaultAsync(a => a.Id == adjuntoId && a.TicketId == ticketId);

        if (adjunto == null)
            return NotFound("Adjunto no encontrado.");

        var stream = await _storage.ObtenerAsync(adjunto.RutaArchivo);
        var contentType = _storage.GetContentType(adjunto.NombreArchivo);
        return File(stream, contentType, adjunto.NombreArchivo);
    }

    [HttpDelete("{adjuntoId:guid}")]
    [Authorize(Roles = "Administrador,Supervisor,Agente")]
    public async Task<IActionResult> Eliminar(Guid ticketId, Guid adjuntoId)
    {
        var adjunto = await _context.AdjuntosTicket
            .FirstOrDefaultAsync(a => a.Id == adjuntoId && a.TicketId == ticketId);

        if (adjunto == null)
            return NotFound("Adjunto no encontrado.");

        await _storage.EliminarAsync(adjunto.RutaArchivo);
        _context.AdjuntosTicket.Remove(adjunto);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
