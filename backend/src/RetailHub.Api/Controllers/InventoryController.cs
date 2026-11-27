using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailHub.Api.Data;
using RetailHub.Api.DTOs;
using RetailHub.Api.DTOs.Inventory;
using RetailHub.Api.Services.Interfaces;

namespace RetailHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = IdentityRoles.Admin)]
public sealed class InventoryController(IInventoryService inventoryService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(PaginatedResponse<InventoryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PaginatedResponse<InventoryResponse>>> GetAll(
        [FromQuery] InventoryQueryParameters queryParameters,
        CancellationToken cancellationToken = default)
    {
        var result = await inventoryService.GetPagedAsync(queryParameters, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{productId:int}")]
    [ProducesResponseType(typeof(InventoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InventoryResponse>> GetByProductId(
        int productId,
        CancellationToken cancellationToken = default)
    {
        var result = await inventoryService.GetByProductIdAsync(productId, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{productId:int}")]
    [ProducesResponseType(typeof(InventoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<InventoryResponse>> Update(
        int productId,
        [FromBody] UpdateInventoryRequest request,
        CancellationToken cancellationToken)
    {
        var updated = await inventoryService.UpdateAsync(productId, request, cancellationToken);
        return Ok(updated);
    }
}
