using RetailHub.Api.DTOs.Orders;
using RetailHub.Api.Entities;

namespace RetailHub.Api.Repositories.Interfaces;

public interface IOrderRepository
{
    Task<Order> CreateOrderTransactionAsync(
        string userId,
        IReadOnlyList<(int ProductId, int Quantity)> items,
        CancellationToken cancellationToken = default);

    Task<(IReadOnlyList<Order> Items, int TotalCount)> GetPagedAsync(
        OrderQueryParameters queryParameters,
        string? restrictToUserId,
        CancellationToken cancellationToken = default);

    Task<Order?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

    Task<Order> UpdateStatusTransactionAsync(
        int orderId,
        OrderStatus newStatus,
        Func<OrderStatus, OrderStatus, bool> isValidTransition,
        CancellationToken cancellationToken = default);
}
