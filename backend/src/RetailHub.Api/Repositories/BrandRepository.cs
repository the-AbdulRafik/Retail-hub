using Microsoft.EntityFrameworkCore;
using RetailHub.Api.Data;
using RetailHub.Api.Entities;
using RetailHub.Api.Repositories.Interfaces;

namespace RetailHub.Api.Repositories;

public sealed class BrandRepository(ApplicationDbContext dbContext) : IBrandRepository
{
    public async Task<IReadOnlyList<Brand>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Brands.AsNoTracking();
        if (!includeInactive)
        {
            query = query.Where(b => b.IsActive);
        }

        return await query
            .OrderBy(b => b.Name)
            .ThenBy(b => b.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Brand?> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Brands.AsNoTracking().Where(b => b.Id == id);
        if (!includeInactive)
        {
            query = query.Where(b => b.IsActive);
        }

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Brand?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Brands.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsByNameAsync(string name, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Brands.AsNoTracking().Where(b => b.Name == name);
        if (excludeId.HasValue)
        {
            query = query.Where(b => b.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<Brand> AddAsync(Brand brand, CancellationToken cancellationToken = default)
    {
        dbContext.Brands.Add(brand);
        await dbContext.SaveChangesAsync(cancellationToken);
        return brand;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
