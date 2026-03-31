using DeskFlow.Core.DTOs.Conocimiento;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/conocimiento")]
[Authorize]
public class ConocimientoController : ControllerBase
{
    private readonly IBaseConocimientoService _service;
    private readonly IFileStorageService _storage;

    public ConocimientoController(IBaseConocimientoService service, IFileStorageService storage)
    {
        _service = service;
        _storage = storage;
    }

    [HttpGet]
    public async Task<IActionResult> Buscar(
        [FromQuery] string? buscar,
        [FromQuery] Guid? categoriaId,
        [FromQuery] int pagina = 1,
        [FromQuery] int porPagina = 10)
    {
        var result = await _service.BuscarAsync(buscar, categoriaId, pagina, porPagina);
        return Ok(result);
    }

    [HttpGet("populares")]
    public async Task<IActionResult> GetPopulares()
    {
        var result = await _service.GetPopularesAsync();
        return Ok(result);
    }

    [HttpGet("sugerir")]
    public async Task<IActionResult> Sugerir([FromQuery] Guid ticketId)
    {
        var result = await _service.SugerirPorTicketAsync(ticketId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpGet("{id}/relacionados")]
    public async Task<IActionResult> GetRelacionados(Guid id)
    {
        var result = await _service.GetRelacionadosAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Agente,Supervisor,Administrador")]
    public async Task<IActionResult> Create([FromBody] CreateArticuloDto dto)
    {
        var result = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Agente,Supervisor,Administrador")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateArticuloDto dto)
    {
        var result = await _service.UpdateAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Supervisor,Administrador")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }

    // ── Adjuntos ──────────────────────────────────────────────

    [HttpPost("{id}/adjuntos")]
    [Authorize(Roles = "Agente,Supervisor,Administrador")]
    [RequestSizeLimit(20_000_000)] // 20 MB
    public async Task<IActionResult> UploadAdjunto(Guid id, IFormFile archivo)
    {
        if (archivo == null || archivo.Length == 0)
            return BadRequest("Archivo requerido.");

        if (archivo.Length > 20_000_000)
            return BadRequest("El archivo no puede superar 20 MB.");

        // Reusar LocalFileStorageService: pasamos id del artículo como "ticketId"
        await using var stream = archivo.OpenReadStream();
        var ruta = await _storage.GuardarAsync(stream, archivo.FileName, archivo.ContentType, Guid.Empty, id);
        var contentType = _storage.GetContentType(archivo.FileName);

        var result = await _service.AddAdjuntoAsync(id, archivo.FileName, ruta, contentType, archivo.Length);
        return Ok(result);
    }

    [HttpGet("{id}/adjuntos/{adjuntoId}")]
    public async Task<IActionResult> DownloadAdjunto(Guid id, Guid adjuntoId)
    {
        var (ruta, nombreOriginal, contentType) = await _service.GetAdjuntoAsync(adjuntoId);
        var stream = await _storage.ObtenerAsync(ruta);
        return File(stream, contentType, nombreOriginal);
    }

    [HttpDelete("{id}/adjuntos/{adjuntoId}")]
    [Authorize(Roles = "Agente,Supervisor,Administrador")]
    public async Task<IActionResult> DeleteAdjunto(Guid id, Guid adjuntoId)
    {
        var (ruta, _, _) = await _service.GetAdjuntoAsync(adjuntoId);
        await _storage.EliminarAsync(ruta);
        await _service.DeleteAdjuntoAsync(adjuntoId);
        return NoContent();
    }
}
