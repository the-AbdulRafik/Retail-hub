using RetailHub.Api.DTOs.Orders;

namespace RetailHub.Api.Services.Interfaces;

public interface IOrderService
{
    Task<OrderResponse> PlaceOrderAsync(
        string userId,
        CreateOrderRequest request,
        CancellationToken cancellationToken = default);
}
