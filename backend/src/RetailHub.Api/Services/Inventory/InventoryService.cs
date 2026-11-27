using RetailHub.Api.Common;
using RetailHub.Api.DTOs;
using RetailHub.Api.DTOs.Inventory;
using RetailHub.Api.Entities;
using RetailHub.Api.Repositories.Interfaces;
using RetailHub.Api.Services.Interfaces;

namespace RetailHub.Api.Services.Inventory;

public sealed class InventoryService(IProductRepository productRepository) : IInventoryService
{
    public async Task<PaginatedResponse<InventoryResponse>> GetPagedAsync(
        InventoryQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await productRepository.GetInventoryPagedAsync(queryParameters, cancellationToken);
        var mapped = items.Select(MapToResponse).ToList();

        return PaginatedResponse<InventoryResponse>.Create(
            mapped,
            queryParameters.Page,
            queryParameters.PageSize,
            totalCount);
    }

    public async Task<InventoryResponse> GetByProductIdAsync(int productId, CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetByIdAsync(productId, includeInactive: true, cancellationToken)
            ?? throw new NotFoundException($"Product with id {productId} was not found.");

        return MapToResponse(product);
    }

    public async Task<InventoryResponse> UpdateAsync(
        int productId,
        UpdateInventoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var product = await productRepository.GetTrackedByIdAsync(productId, cancellationToken)
            ?? throw new NotFoundException($"Product with id {productId} was not found.");

        byte[] rowVersionBytes;
        try
        {
            rowVersionBytes = Convert.FromBase64String(request.RowVersion);
        }
        catch (FormatException)
        {
            throw new BadRequestException("Invalid RowVersion token format.");
        }

        product.StockQuantity = request.StockQuantity;
        product.ReorderLevel = request.ReorderLevel;

        var updated = await productRepository.UpdateAsync(product, rowVersionBytes, cancellationToken);
        return MapToResponse(updated);
    }

    private static InventoryResponse MapToResponse(Product product) => new(
        product.Id,
        product.Name,
        product.Brand.Name,
        product.Category.Name,
        product.PackagingType,
        product.PackagingSize,
        product.StockQuantity,
        product.ReorderLevel,
        product.StockQuantity <= product.ReorderLevel,
        product.IsActive,
        Convert.ToBase64String(product.RowVersion));
}
