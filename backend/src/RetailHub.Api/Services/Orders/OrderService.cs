using RetailHub.Api.Common;
using RetailHub.Api.DTOs;
using RetailHub.Api.DTOs.Orders;
using RetailHub.Api.Entities;
using RetailHub.Api.Repositories.Interfaces;
using RetailHub.Api.Services.Interfaces;

namespace RetailHub.Api.Services.Orders;

public sealed class OrderService(IOrderRepository orderRepository) : IOrderService
{
    private static readonly IReadOnlyDictionary<OrderStatus, OrderStatus[]> AllowedTransitions =
        new Dictionary<OrderStatus, OrderStatus[]>
        {
            [OrderStatus.Pending] = [OrderStatus.Confirmed, OrderStatus.Cancelled],
            [OrderStatus.Confirmed] = [OrderStatus.Preparing, OrderStatus.Cancelled],
            [OrderStatus.Preparing] = [OrderStatus.OutForDelivery, OrderStatus.Cancelled],
            [OrderStatus.OutForDelivery] = [OrderStatus.Delivered],
            [OrderStatus.Delivered] = [],
            [OrderStatus.Cancelled] = []
        };

    public async Task<OrderResponse> PlaceOrderAsync(
        string userId,
        CreateOrderRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Items.Count == 0)
        {
            throw new BadRequestException("At least one order item is required.");
        }

        var aggregatedItems = request.Items
            .GroupBy(i => i.ProductId)
            .Select(g => (ProductId: g.Key, Quantity: g.Sum(x => x.Quantity)))
            .ToList();

        var order = await orderRepository.CreateOrderTransactionAsync(userId, aggregatedItems, cancellationToken);
        return MapToResponse(order);
    }

    public async Task<PaginatedResponse<OrderResponse>> GetMyOrdersAsync(
        string userId,
        OrderQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await orderRepository.GetPagedAsync(
            queryParameters,
            restrictToUserId: userId,
            cancellationToken);

        var mapped = items.Select(MapToResponse).ToList();
        return PaginatedResponse<OrderResponse>.Create(
            mapped,
            queryParameters.Page,
            queryParameters.PageSize,
            totalCount);
    }

    public async Task<OrderResponse> GetByIdAsync(
        int orderId,
        string requesterUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default)
    {
        var order = await orderRepository.GetByIdAsync(orderId, cancellationToken)
            ?? throw new NotFoundException($"Order with id {orderId} was not found.");

        if (!isAdmin && !string.Equals(order.UserId, requesterUserId, StringComparison.Ordinal))
        {
            throw new ForbiddenException("You do not have permission to view this order.");
        }

        return MapToResponse(order);
    }

    public async Task<PaginatedResponse<OrderResponse>> GetAllOrdersAsync(
        OrderQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await orderRepository.GetPagedAsync(
            queryParameters,
            restrictToUserId: null,
            cancellationToken);

        var mapped = items.Select(MapToResponse).ToList();
        return PaginatedResponse<OrderResponse>.Create(
            mapped,
            queryParameters.Page,
            queryParameters.PageSize,
            totalCount);
    }

    public async Task<OrderResponse> UpdateStatusAsync(
        int orderId,
        UpdateOrderStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var updated = await orderRepository.UpdateStatusTransactionAsync(
            orderId,
            request.Status,
            IsValidTransition,
            cancellationToken);

        return MapToResponse(updated);
    }

    private static bool IsValidTransition(OrderStatus current, OrderStatus next)
    {
        return AllowedTransitions.TryGetValue(current, out var validTargets) &&
               validTargets.Contains(next);
    }

    internal static OrderResponse MapToResponse(Order order) => new(
        order.Id,
        order.OrderNumber,
        order.UserId,
        order.User.DisplayName,
        order.TotalAmount,
        order.Status.ToString(),
        order.CreatedAt,
        order.OrderItems
            .Select(oi => new OrderItemResponse(
                oi.Id,
                oi.ProductId,
                oi.ProductName,
                oi.UnitPrice,
                oi.Quantity,
                oi.PackagingDetails,
                oi.UnitPrice * oi.Quantity))
            .ToList());
}
