using Microsoft.AspNetCore.Mvc;

namespace RetailHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { status = "ok", service = "RetailHub.Api", timestamp = DateTime.UtcNow });
    }
}
