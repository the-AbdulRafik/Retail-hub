using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using RetailHub.Api.Configurations;
using RetailHub.Api.Entities;

namespace RetailHub.Api.Data;

public static class IdentityRoles
{
    public const string Admin = "Admin";
    public const string Customer = "Customer";

    public static readonly string[] All = [Admin, Customer];
}

public static class IdentitySeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var seedAdmin = scope.ServiceProvider.GetRequiredService<IOptions<SeedAdminOptions>>().Value;

        foreach (var roleName in IdentityRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var roleResult = await roleManager.CreateAsync(new IdentityRole(roleName));
                if (!roleResult.Succeeded)
                {
                    var errors = string.Join("; ", roleResult.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Failed to seed role '{roleName}': {errors}");
                }
            }
        }

        var adminUser = await userManager.FindByEmailAsync(seedAdmin.Email);
        if (adminUser is null)
        {
            adminUser = new ApplicationUser
            {
                UserName = seedAdmin.Email,
                Email = seedAdmin.Email,
                DisplayName = "System Admin",
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(adminUser, seedAdmin.Password);
            if (!createResult.Succeeded)
            {
                var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to seed admin user '{seedAdmin.Email}': {errors}");
            }
        }

        if (!await userManager.IsInRoleAsync(adminUser, IdentityRoles.Admin))
        {
            var addRoleResult = await userManager.AddToRoleAsync(adminUser, IdentityRoles.Admin);
            if (!addRoleResult.Succeeded)
            {
                var errors = string.Join("; ", addRoleResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Failed to assign '{IdentityRoles.Admin}' role to '{seedAdmin.Email}': {errors}");
            }
        }
    }
}
