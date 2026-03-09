using Microsoft.AspNetCore.Mvc;
using QuestPDF.Fluent;
using Dfrnt.Reports.Documents;
using Dfrnt.Reports.Services;

namespace Dfrnt.Reports.Controllers;

[ApiController]
[Route("api/reports/rate-schedule")]
public class RateScheduleController : ControllerBase
{
    private readonly RateScheduleDataService _dataService;
    private readonly ILogger<RateScheduleController> _logger;

    public RateScheduleController(RateScheduleDataService dataService, ILogger<RateScheduleController> logger)
    {
        _dataService = dataService;
        _logger = logger;
    }

    /// <summary>
    /// Generate and download a PDF rate schedule for a client.
    /// </summary>
    /// <param name="clientId">TMS Client ID</param>
    /// <param name="fromSuburbId">Origin suburb ID (optional, defaults to client's primary site)</param>
    [HttpGet("{clientId:int}")]
    [Produces("application/pdf")]
    public async Task<IActionResult> GetPdf(int clientId, [FromQuery] int? fromSuburbId = null, CancellationToken ct = default)
    {
        try
        {
            var suburbId = fromSuburbId ?? await GetDefaultSuburbId(clientId, ct);
            var data = await _dataService.GetRateScheduleAsync(clientId, suburbId, ct);

            var document = new RateScheduleDocument(data);
            var pdf = document.GeneratePdf();

            var fileName = $"Rate-Schedule-{data.ClientName.Replace(" ", "-")}-{data.FromSuburb}-{data.PrintDate:yyyy-MM-dd}.pdf";
            return File(pdf, "application/pdf", fileName);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Failed to fetch rate data from TMS API for client {ClientId}", clientId);
            return StatusCode(502, new { error = "Failed to fetch rate data from TMS API", detail = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate rate schedule PDF for client {ClientId}", clientId);
            return StatusCode(500, new { error = "Failed to generate rate schedule", detail = ex.Message });
        }
    }

    /// <summary>
    /// Get rate schedule data as JSON (for the React frontend preview).
    /// </summary>
    [HttpGet("{clientId:int}/preview")]
    [Produces("application/json")]
    public async Task<IActionResult> GetPreview(int clientId, [FromQuery] int? fromSuburbId = null, CancellationToken ct = default)
    {
        try
        {
            var suburbId = fromSuburbId ?? await GetDefaultSuburbId(clientId, ct);
            var data = await _dataService.GetRateScheduleAsync(clientId, suburbId, ct);
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get rate schedule preview for client {ClientId}", clientId);
            return StatusCode(500, new { error = "Failed to get rate schedule data", detail = ex.Message });
        }
    }

    private Task<int> GetDefaultSuburbId(int clientId, CancellationToken ct)
    {
        // TODO: Look up client's primary site/suburb from TMS
        // For now, return a placeholder
        return Task.FromResult(0);
    }
}
