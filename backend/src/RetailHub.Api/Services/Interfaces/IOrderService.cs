using RetailHub.Api.DTOs;
using RetailHub.Api.DTOs.Orders;

namespace RetailHub.Api.Services.Interfaces;

public interface IOrderService
{
    Task<OrderResponse> PlaceOrderAsync(
        string userId,
        CreateOrderRequest request,
        CancellationToken cancellationToken = default);

    Task<PaginatedResponse<OrderResponse>> GetMyOrdersAsync(
        string userId,
        OrderQueryParameters queryParameters,
        CancellationToken cancellationToken = default);

    Task<OrderResponse> GetByIdAsync(
        int orderId,
        string requesterUserId,
        bool isAdmin,
        CancellationToken cancellationToken = default);

    Task<PaginatedResponse<OrderResponse>> GetAllOrdersAsync(
        OrderQueryParameters queryParameters,
        CancellationToken cancellationToken = default);

    Task<OrderResponse> UpdateStatusAsync(
        int orderId,
        UpdateOrderStatusRequest request,
        CancellationToken cancellationToken = default);
}
