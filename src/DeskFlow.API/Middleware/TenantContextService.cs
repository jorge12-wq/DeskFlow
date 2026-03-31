using System.Security.Claims;
using DeskFlow.Core.Interfaces;

namespace DeskFlow.API.Middleware;

public class TenantContextService : ITenantContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantContextService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid TenantId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User.FindFirstValue("tenantId");
            return claim != null ? Guid.Parse(claim) : Guid.Empty;
        }
    }

    public Guid UsuarioId
    {
        get
        {
            var claim = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? _httpContextAccessor.HttpContext?.User.FindFirstValue("sub");
            return claim != null ? Guid.Parse(claim) : Guid.Empty;
        }
    }

    public string RolNombre =>
        _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
}
