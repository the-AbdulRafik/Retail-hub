using Microsoft.EntityFrameworkCore;
using RetailHub.Api.Common;
using RetailHub.Api.Data;
using RetailHub.Api.DTOs.Catalog;
using RetailHub.Api.Entities;
using RetailHub.Api.Repositories.Interfaces;

namespace RetailHub.Api.Repositories;

public sealed class ProductRepository(ApplicationDbContext dbContext) : IProductRepository
{
    public async Task<(IReadOnlyList<Product> Items, int TotalCount)> GetPagedAsync(
        ProductQueryParameters queryParameters,
        bool includeInactive,
        CancellationToken cancellationToken = default)
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

        if (!string.IsNullOrWhiteSpace(queryParameters.Search))
        {
            var term = queryParameters.Search.Trim();
            query = query.Where(p =>
                p.Name.Contains(term) ||
                (p.Description != null && p.Description.Contains(term)));
        }

        if (queryParameters.CategoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == queryParameters.CategoryId.Value);
        }

        if (queryParameters.BrandId.HasValue)
        {
            query = query.Where(p => p.BrandId == queryParameters.BrandId.Value);
        }

        if (!string.IsNullOrWhiteSpace(queryParameters.PackagingType))
        {
            var packagingType = queryParameters.PackagingType.Trim();
            query = query.Where(p => p.PackagingType == packagingType);
        }

        if (queryParameters.MinPrice.HasValue)
        {
            query = query.Where(p => p.Price >= queryParameters.MinPrice.Value);
        }

        if (queryParameters.MaxPrice.HasValue)
        {
            query = query.Where(p => p.Price <= queryParameters.MaxPrice.Value);
        }

        if (queryParameters.InStockOnly)
        {
            query = query.Where(p => p.StockQuantity > 0);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var isDescending = string.Equals(queryParameters.SortOrder, "desc", StringComparison.OrdinalIgnoreCase);
        var orderedQuery = queryParameters.SortBy.Trim().ToLowerInvariant() switch
        {
            "name" => isDescending
                ? query.OrderByDescending(p => p.Name).ThenByDescending(p => p.Id)
                : query.OrderBy(p => p.Name).ThenBy(p => p.Id),
            "price" => isDescending
                ? query.OrderByDescending(p => p.Price).ThenByDescending(p => p.Id)
                : query.OrderBy(p => p.Price).ThenBy(p => p.Id),
            "createdat" => isDescending
                ? query.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id)
                : query.OrderBy(p => p.CreatedAt).ThenBy(p => p.Id),
            "stockquantity" => isDescending
                ? query.OrderByDescending(p => p.StockQuantity).ThenByDescending(p => p.Id)
                : query.OrderBy(p => p.StockQuantity).ThenBy(p => p.Id),
            _ => throw new BadRequestException($"Unsupported sortBy value '{queryParameters.SortBy}'. Allowed values: name, price, createdAt, stockQuantity.")
        };

        var items = await orderedQuery
            .Skip((queryParameters.Page - 1) * queryParameters.PageSize)
            .Take(queryParameters.PageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
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
