namespace RetailHub.Api.DTOs.Auth;

public sealed record UserResponse(
    string Id,
    string DisplayName,
    string Email,
    IReadOnlyList<string> Roles);

public sealed record AuthResponse(
    string Token,
    DateTime ExpiresAt,
    UserResponse User);
