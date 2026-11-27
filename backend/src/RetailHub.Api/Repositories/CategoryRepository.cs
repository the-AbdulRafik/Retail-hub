using Microsoft.EntityFrameworkCore;
using RetailHub.Api.Data;
using RetailHub.Api.Entities;
using RetailHub.Api.Repositories.Interfaces;

namespace RetailHub.Api.Repositories;

public sealed class CategoryRepository(ApplicationDbContext dbContext) : ICategoryRepository
{
    public async Task<IReadOnlyList<Category>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Categories.AsNoTracking();
        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        return await query
            .OrderBy(c => c.Name)
            .ThenBy(c => c.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Category?> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Categories.AsNoTracking().Where(c => c.Id == id);
        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Category?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Categories.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<bool> ExistsByNameAsync(string name, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Categories.AsNoTracking().Where(c => c.Name == name);
        if (excludeId.HasValue)
        {
            query = query.Where(c => c.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<Category> AddAsync(Category category, CancellationToken cancellationToken = default)
    {
        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync(cancellationToken);
        return category;
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
