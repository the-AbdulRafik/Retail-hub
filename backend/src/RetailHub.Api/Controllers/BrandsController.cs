using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailHub.Api.Data;
using RetailHub.Api.DTOs.Catalog;
using RetailHub.Api.Services.Interfaces;

namespace RetailHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class BrandsController(IBrandService brandService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IReadOnlyList<BrandResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<BrandResponse>>> GetAll(
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        var canIncludeInactive = includeInactive && User.IsInRole(IdentityRoles.Admin);
        var brands = await brandService.GetAllAsync(canIncludeInactive, cancellationToken);
        return Ok(brands);
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(BrandResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BrandResponse>> GetById(
        int id,
        CancellationToken cancellationToken = default)
    {
        var isAdmin = User.IsInRole(IdentityRoles.Admin);
        var brand = await brandService.GetByIdAsync(id, isAdmin, cancellationToken);
        return Ok(brand);
    }

    [HttpPost]
    [Authorize(Roles = IdentityRoles.Admin)]
    [ProducesResponseType(typeof(BrandResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BrandResponse>> Create(
        [FromBody] CreateBrandRequest request,
        CancellationToken cancellationToken)
    {
        var created = await brandService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = IdentityRoles.Admin)]
    [ProducesResponseType(typeof(BrandResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BrandResponse>> Update(
        int id,
        [FromBody] UpdateBrandRequest request,
        CancellationToken cancellationToken)
    {
        var updated = await brandService.UpdateAsync(id, request, cancellationToken);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = IdentityRoles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await brandService.DeactivateAsync(id, cancellationToken);
        return NoContent();
    }
}
