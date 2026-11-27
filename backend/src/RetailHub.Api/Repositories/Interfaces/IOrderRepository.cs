using RetailHub.Api.DTOs.Orders;
using RetailHub.Api.Entities;

namespace RetailHub.Api.Repositories.Interfaces;

public interface IOrderRepository
{
    Task<Order> CreateOrderTransactionAsync(
        string userId,
        IReadOnlyList<(int ProductId, int Quantity)> items,
        CancellationToken cancellationToken = default);
}
