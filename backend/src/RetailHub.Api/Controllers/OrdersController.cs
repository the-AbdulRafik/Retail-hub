using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailHub.Api.Data;
using RetailHub.Api.DTOs;
using RetailHub.Api.DTOs.Orders;
using RetailHub.Api.Services.Interfaces;

namespace RetailHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class OrdersController(IOrderService orderService) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(OrderResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<OrderResponse>> PlaceOrder(
        [FromBody] CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var created = await orderService.PlaceOrderAsync(userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(PaginatedResponse<OrderResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PaginatedResponse<OrderResponse>>> GetMyOrders(
        [FromQuery] OrderQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var result = await orderService.GetMyOrdersAsync(userId, queryParameters, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(OrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderResponse>> GetById(
        int id,
        CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized();
        }

        var isAdmin = User.IsInRole(IdentityRoles.Admin);
        var result = await orderService.GetByIdAsync(id, userId, isAdmin, cancellationToken);
        return Ok(result);
    }

    [HttpGet]
    [Authorize(Roles = IdentityRoles.Admin)]
    [ProducesResponseType(typeof(PaginatedResponse<OrderResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PaginatedResponse<OrderResponse>>> GetAll(
        [FromQuery] OrderQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var result = await orderService.GetAllOrdersAsync(queryParameters, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = IdentityRoles.Admin)]
    [ProducesResponseType(typeof(OrderResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<OrderResponse>> UpdateStatus(
        int id,
        [FromBody] UpdateOrderStatusRequest request,
        CancellationToken cancellationToken)
    {
        var updated = await orderService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(updated);
    }
}
