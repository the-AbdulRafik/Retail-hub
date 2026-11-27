using RetailHub.Api.Common;
using RetailHub.Api.DTOs.Catalog;
using RetailHub.Api.Entities;
using RetailHub.Api.Repositories.Interfaces;
using RetailHub.Api.Services.Interfaces;

namespace RetailHub.Api.Services.Catalog;

public sealed class ProductService(IProductRepository productRepository) : IProductService
{
    public async Task<IReadOnlyList<ProductResponse>> GetAllAsync(bool includeInactive, CancellationToken cancellationToken = default)
    {
        var products = await productRepository.GetAllAsync(includeInactive, cancellationToken);
        return products.Select(MapToResponse).ToList();
    }

    public async Task<ProductResponse> GetByIdAsync(int id, bool includeInactive, CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetByIdAsync(id, includeInactive, cancellationToken)
            ?? throw new NotFoundException($"Product with id {id} was not found.");

        return MapToResponse(product);
    }

    public async Task<ProductResponse> CreateAsync(CreateProductRequest request, CancellationToken cancellationToken = default)
    {
        await EnsureActiveReferencesAsync(request.BrandId, request.CategoryId, cancellationToken);

        var product = new Product
        {
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Price = request.Price,
            ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim(),
            BrandId = request.BrandId,
            CategoryId = request.CategoryId,
            PackagingType = request.PackagingType.Trim(),
            PackagingSize = request.PackagingSize.Trim(),
            StockQuantity = request.StockQuantity,
            ReorderLevel = request.ReorderLevel,
            IsActive = true
        };

        var created = await productRepository.AddAsync(product, cancellationToken);
        return MapToResponse(created);
    }

    public async Task<ProductResponse> UpdateAsync(int id, UpdateProductRequest request, CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetTrackedByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Product with id {id} was not found.");

        byte[] rowVersionBytes;
        try
        {
            rowVersionBytes = Convert.FromBase64String(request.RowVersion);
        }
        catch (FormatException)
        {
            throw new BadRequestException("Invalid RowVersion token format.");
        }

        await EnsureActiveReferencesAsync(request.BrandId, request.CategoryId, cancellationToken);

        product.Name = request.Name.Trim();
        product.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        product.Price = request.Price;
        product.ImageUrl = string.IsNullOrWhiteSpace(request.ImageUrl) ? null : request.ImageUrl.Trim();
        product.BrandId = request.BrandId;
        product.CategoryId = request.CategoryId;
        product.PackagingType = request.PackagingType.Trim();
        product.PackagingSize = request.PackagingSize.Trim();
        product.StockQuantity = request.StockQuantity;
        product.ReorderLevel = request.ReorderLevel;
        product.IsActive = request.IsActive;

        var updated = await productRepository.UpdateAsync(product, rowVersionBytes, cancellationToken);
        return MapToResponse(updated);
    }

    public async Task DeactivateAsync(int id, CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetTrackedByIdAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Product with id {id} was not found.");

        if (!product.IsActive)
        {
            return;
        }

        product.IsActive = false;
        await productRepository.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureActiveReferencesAsync(int brandId, int categoryId, CancellationToken cancellationToken)
    {
        if (!await productRepository.IsActiveBrandAsync(brandId, cancellationToken))
        {
            throw new BadRequestException($"Brand with id {brandId} does not exist or is inactive.");
        }

        if (!await productRepository.IsActiveCategoryAsync(categoryId, cancellationToken))
        {
            throw new BadRequestException($"Category with id {categoryId} does not exist or is inactive.");
        }
    }

    internal static ProductResponse MapToResponse(Product product) => new(
        product.Id,
        product.Name,
        product.Description,
        product.Price,
        product.ImageUrl,
        product.BrandId,
        product.Brand.Name,
        product.CategoryId,
        product.Category.Name,
        product.PackagingType,
        product.PackagingSize,
        product.StockQuantity,
        product.ReorderLevel,
        product.IsActive,
        Convert.ToBase64String(product.RowVersion),
        product.CreatedAt);
}
