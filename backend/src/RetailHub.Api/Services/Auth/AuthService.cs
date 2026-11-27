using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using RetailHub.Api.Common;
using RetailHub.Api.Configurations;
using RetailHub.Api.Data;
using RetailHub.Api.DTOs.Auth;
using RetailHub.Api.Entities;
using RetailHub.Api.Services.Interfaces;

namespace RetailHub.Api.Services.Auth;

public sealed class AuthService(
    UserManager<ApplicationUser> userManager,
    IOptions<JwtOptions> jwtOptions) : IAuthService
{
    private readonly JwtOptions _jwtOptions = jwtOptions.Value;

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim();
        var existingUser = await userManager.FindByEmailAsync(normalizedEmail);
        if (existingUser is not null)
        {
            throw new ConflictException($"An account with email '{normalizedEmail}' already exists.");
        }

        var user = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            DisplayName = request.DisplayName.Trim(),
            EmailConfirmed = true
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            throw new BadRequestException(errors);
        }

        var roleResult = await userManager.AddToRoleAsync(user, IdentityRoles.Customer);
        if (!roleResult.Succeeded)
        {
            var errors = string.Join("; ", roleResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to assign default customer role: {errors}");
        }

        var roles = await userManager.GetRolesAsync(user);
        return CreateTokenResponse(user, roles.ToList());
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var email = request.Email.Trim();
        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            throw new UnauthorizedAppException("Invalid email or password.");
        }

        var passwordValid = await userManager.CheckPasswordAsync(user, request.Password);
        if (!passwordValid)
        {
            throw new UnauthorizedAppException("Invalid email or password.");
        }

        var roles = await userManager.GetRolesAsync(user);
        return CreateTokenResponse(user, roles.ToList());
    }

    public async Task<UserResponse> GetCurrentUserAsync(string userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException("Authenticated user was not found.");

        var roles = await userManager.GetRolesAsync(user);
        return new UserResponse(
            user.Id,
            user.DisplayName,
            user.Email ?? string.Empty,
            roles.ToList());
    }

    private AuthResponse CreateTokenResponse(ApplicationUser user, IReadOnlyList<string> roles)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpiresInMinutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Name, user.DisplayName)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        var encodedToken = new JwtSecurityTokenHandler().WriteToken(token);
        var userResponse = new UserResponse(user.Id, user.DisplayName, user.Email ?? string.Empty, roles);
        return new AuthResponse(encodedToken, expiresAt, userResponse);
    }
}
