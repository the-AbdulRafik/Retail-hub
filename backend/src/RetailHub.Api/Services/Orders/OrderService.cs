using RetailHub.Api.Common;
using RetailHub.Api.DTOs.Orders;
using RetailHub.Api.Entities;
using RetailHub.Api.Repositories.Interfaces;
using RetailHub.Api.Services.Interfaces;

namespace RetailHub.Api.Services.Orders;

public sealed class OrderService(IOrderRepository orderRepository) : IOrderService
{
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
