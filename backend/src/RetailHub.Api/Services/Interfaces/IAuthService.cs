using RetailHub.Api.DTOs.Auth;

namespace RetailHub.Api.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);
    Task<UserResponse> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default);
}
