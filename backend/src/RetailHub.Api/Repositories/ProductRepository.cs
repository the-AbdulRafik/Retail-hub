using Microsoft.EntityFrameworkCore;
using RetailHub.Api.Common;
using RetailHub.Api.Data;
using RetailHub.Api.Entities;
using RetailHub.Api.Repositories.Interfaces;

namespace RetailHub.Api.Repositories;

public sealed class ProductRepository(ApplicationDbContext dbContext) : IProductRepository
{
    public async Task<IReadOnlyList<Product>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Products
            .AsNoTracking()
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(p => p.IsActive);
        }

        return await query
            .OrderBy(p => p.Name)
            .ThenBy(p => p.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<Product?> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Products
            .AsNoTracking()
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .Where(p => p.Id == id);

        if (!includeInactive)
        {
            query = query.Where(p => p.IsActive);
        }

        return await query.FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Product?> GetTrackedByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Products
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<bool> IsActiveBrandAsync(int brandId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Brands
            .AsNoTracking()
            .AnyAsync(b => b.Id == brandId && b.IsActive, cancellationToken);
    }

    public async Task<bool> IsActiveCategoryAsync(int categoryId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Categories
            .AsNoTracking()
            .AnyAsync(c => c.Id == categoryId && c.IsActive, cancellationToken);
    }

    public async Task<Product> AddAsync(Product product, CancellationToken cancellationToken = default)
    {
        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(cancellationToken);

        return await dbContext.Products
            .AsNoTracking()
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .FirstAsync(p => p.Id == product.Id, cancellationToken);
    }

    public async Task<Product> UpdateAsync(Product product, byte[] expectedRowVersion, CancellationToken cancellationToken = default)
    {
        dbContext.Entry(product).Property(p => p.RowVersion).OriginalValue = expectedRowVersion;

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new ConflictException("The product was modified by another request. Refresh and retry with the latest RowVersion.");
        }

        return await dbContext.Products
            .AsNoTracking()
            .Include(p => p.Brand)
            .Include(p => p.Category)
            .FirstAsync(p => p.Id == product.Id, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
