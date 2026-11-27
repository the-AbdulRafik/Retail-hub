using RetailHub.Api.DTOs;
using RetailHub.Api.DTOs.Inventory;

namespace RetailHub.Api.Services.Interfaces;

public interface IInventoryService
{
    Task<PaginatedResponse<InventoryResponse>> GetPagedAsync(
        InventoryQueryParameters queryParameters,
        CancellationToken cancellationToken = default);
    Task<InventoryResponse> GetByProductIdAsync(int productId, CancellationToken cancellationToken = default);
    Task<InventoryResponse> UpdateAsync(
        int productId,
        UpdateInventoryRequest request,
        CancellationToken cancellationToken = default);
}
