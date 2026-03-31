using DeskFlow.Core.DTOs.Auth;

namespace DeskFlow.Core.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto dto);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken);
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
    Task RevokeTokenAsync(Guid usuarioId);
}
