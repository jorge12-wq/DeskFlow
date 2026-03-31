using DeskFlow.Core.DTOs.Auth;
using DeskFlow.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DeskFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Login y obtención de tokens.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        return Ok(result);
    }

    /// <summary>Registro de nuevo usuario.</summary>
    [HttpPost("register")]
    [Authorize(Roles = "Administrador")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        // Inject tenant from the logged-in admin's context
        var tenantContext = HttpContext.RequestServices.GetRequiredService<ITenantContext>();
        dto.TenantId = tenantContext.TenantId;

        var result = await _authService.RegisterAsync(dto);
        return Created(string.Empty, result);
    }

    /// <summary>Renovar access token con refresh token.</summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Refresh([FromBody] RefreshTokenDto dto)
    {
        var result = await _authService.RefreshTokenAsync(dto.RefreshToken);
        return Ok(result);
    }

    /// <summary>Cerrar sesión (revocar refresh token).</summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var tenantContext = HttpContext.RequestServices.GetRequiredService<ITenantContext>();
        await _authService.RevokeTokenAsync(tenantContext.UsuarioId);
        return NoContent();
    }
}
