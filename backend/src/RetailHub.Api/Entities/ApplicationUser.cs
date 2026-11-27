using Microsoft.AspNetCore.Identity;

namespace RetailHub.Api.Entities;

public class ApplicationUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}
