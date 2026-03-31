using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DeskFlow.Core.DTOs.Auth;
using DeskFlow.Core.Entities;
using DeskFlow.Core.Interfaces;
using DeskFlow.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace DeskFlow.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly DeskFlowDbContext _context;
    private readonly IConfiguration _config;

    public AuthService(DeskFlowDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var usuario = await _context.Usuarios
            .IgnoreQueryFilters()
            .Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Activo);

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales inválidas.");

        return await GenerateTokensAsync(usuario);
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var emailExiste = await _context.Usuarios
            .IgnoreQueryFilters()
            .AnyAsync(u => u.TenantId == dto.TenantId && u.Email == dto.Email);

        if (emailExiste)
            throw new InvalidOperationException("El email ya está en uso en este tenant.");

        var usuario = new Usuario
        {
            TenantId = dto.TenantId,
            RolId = dto.RolId,
            Nombre = dto.Nombre,
            Apellido = dto.Apellido,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            SucursalId = dto.SucursalId,
            AreaId = dto.AreaId,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        await _context.Usuarios.AddAsync(usuario);
        await _context.SaveChangesAsync();

        // Reload with rol
        await _context.Entry(usuario).Reference(u => u.Rol).LoadAsync();

        return await GenerateTokensAsync(usuario);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken)
    {
        var usuario = await _context.Usuarios
            .IgnoreQueryFilters()
            .Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken
                                   && u.RefreshTokenExpiry > DateTime.UtcNow
                                   && u.Activo);

        if (usuario == null)
            throw new UnauthorizedAccessException("Refresh token inválido o expirado.");

        return await GenerateTokensAsync(usuario);
    }

    public async Task RevokeTokenAsync(Guid usuarioId)
    {
        var usuario = await _context.Usuarios
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == usuarioId);

        if (usuario != null)
        {
            usuario.RefreshToken = null;
            usuario.RefreshTokenExpiry = null;
            await _context.SaveChangesAsync();
        }
    }

    private async Task<AuthResponseDto> GenerateTokensAsync(Usuario usuario)
    {
        var jwtKey = _config["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key no configurada.");
        var jwtIssuer = _config["Jwt:Issuer"] ?? "DeskFlow";
        var jwtAudience = _config["Jwt:Audience"] ?? "DeskFlow";
        var expiryMinutes = int.Parse(_config["Jwt:ExpiryMinutes"] ?? "60");

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("tenantId", usuario.TenantId.ToString()),
            new Claim("rolId", usuario.RolId.ToString()),
            new Claim(ClaimTypes.Role, usuario.Rol.Nombre),
            new Claim("nombre", $"{usuario.Nombre} {usuario.Apellido}"),
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddMinutes(expiryMinutes);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = GenerateRefreshToken();

        usuario.RefreshToken = refreshToken;
        usuario.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            Expiry = expiry,
            Usuario = new UsuarioInfoDto
            {
                Id = usuario.Id,
                Nombre = usuario.Nombre,
                Apellido = usuario.Apellido,
                Email = usuario.Email,
                Rol = usuario.Rol.Nombre,
                TenantId = usuario.TenantId
            }
        };
    }

    private static string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }
}
