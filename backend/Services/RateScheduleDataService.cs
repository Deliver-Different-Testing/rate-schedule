using System.Net.Http.Json;
using Dfrnt.Reports.Models;

namespace Dfrnt.Reports.Services;

/// <summary>
/// Fetches rate schedule data from the TMS API.
/// Calls the WS_stpJobType_Rates stored procedure for each destination suburb
/// and maps results to the RateScheduleData model.
/// </summary>
public class RateScheduleDataService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<RateScheduleDataService> _logger;

    // Speed column mapping from JobTypeID to column index
    // These map the SP's JobTypeID values to our rate matrix columns
    private static readonly Dictionary<int, int> JobTypeToColumnIndex = new()
    {
        // JobTypeID → column index (0=Eco, 1=3Hr, 2=2Hr, 3=90Min, 4=75Min, 5=1Hr, 6=45Min, 7=30Min, 8=15Min, 9=Direct)
        // Actual mappings will depend on the TMS configuration
        { 1, 0 },   // Eco
        { 2, 1 },   // 3 Hour
        { 3, 2 },   // 2 Hour
        { 4, 3 },   // 90 Min
        { 5, 4 },   // 75 Min
        { 6, 5 },   // 1 Hour
        { 7, 6 },   // 45 Min
        { 8, 7 },   // 30 Min
        { 9, 8 },   // 15 Min
        { 10, 9 },  // Direct
    };

    public RateScheduleDataService(HttpClient httpClient, ILogger<RateScheduleDataService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <summary>
    /// Fetches complete rate schedule data for a client from a given origin suburb.
    /// </summary>
    public async Task<RateScheduleData> GetRateScheduleAsync(int clientId, int fromSuburbId, CancellationToken ct = default)
    {
        var data = new RateScheduleData
        {
            PrintDate = DateTime.Now,
            SiteId = fromSuburbId
        };

        // 1. Get client info
        var clientInfo = await GetClientInfoAsync(clientId, ct);
        data.ClientName = clientInfo.Name;
        data.FromSuburb = clientInfo.FromSuburb;

        // 2. Get destination suburbs for this origin
        var destinations = await GetDestinationSuburbsAsync(fromSuburbId, ct);

        // 3. For each destination, call the SP to get rates
        foreach (var dest in destinations.OrderBy(d => d.Name))
        {
            var spResults = await CallRatesSpAsync(clientId, fromSuburbId, dest.SuburbId, ct);
            var row = MapToRateRow(dest.Name, spResults);
            data.OnDemandRates.Add(row);
        }

        // 4. Get scheduled services from contract data
        data.ScheduledServices = await GetScheduledServicesAsync(clientId, ct);

        // 5. Get extra charges from system config
        data.Extras = await GetExtraChargesAsync(clientId, ct);

        return data;
    }

    private async Task<ClientInfo> GetClientInfoAsync(int clientId, CancellationToken ct)
    {
        // TODO: Wire to actual TMS API endpoint
        // GET /api/Clients/{clientId}
        var response = await _httpClient.GetAsync($"/api/Clients/{clientId}", ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<ClientInfo>(ct) ?? new();
    }

    private async Task<List<SuburbInfo>> GetDestinationSuburbsAsync(int fromSuburbId, CancellationToken ct)
    {
        // TODO: Wire to actual TMS API
        // Gets all suburbs linked to the same SiteId/Area via TucSuburb.UcsuArea
        // GET /api/Suburbs/destinations?fromSuburbId={fromSuburbId}
        var response = await _httpClient.GetAsync($"/api/Suburbs/destinations?fromSuburbId={fromSuburbId}", ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<SuburbInfo>>(ct) ?? new();
    }

    /// <summary>
    /// Calls WS_stpJobType_Rates stored procedure via the TMS API.
    /// Returns rate data for all available speeds between two suburbs for a client.
    /// </summary>
    private async Task<List<SpRateResult>> CallRatesSpAsync(int clientId, int fromSuburbId, int toSuburbId, CancellationToken ct)
    {
        // POST /api/Rates/GetRateSchedule
        // Body: { clientId, fromSuburbId, toSuburbId }
        // SP: WS_stpJobType_Rates @ClientID, @FromSuburbID, @ToSuburbID
        // Returns: JobTypeID, Name, SaleRate, Rate, Availability
        var request = new { clientId, fromSuburbId, toSuburbId };
        var response = await _httpClient.PostAsJsonAsync("/api/Rates/GetRateSchedule", request, ct);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<SpRateResult>>(ct) ?? new();
    }

    private RateRow MapToRateRow(string destination, List<SpRateResult> spResults)
    {
        var row = new RateRow { Destination = destination };

        foreach (var result in spResults.Where(r => r.Availability))
        {
            if (!JobTypeToColumnIndex.TryGetValue(result.JobTypeID, out var colIndex))
            {
                _logger.LogWarning("Unknown JobTypeID {JobTypeID} for destination {Dest}", result.JobTypeID, destination);
                continue;
            }

            var rate = result.SaleRate > 0 ? result.SaleRate : result.Rate;

            switch (colIndex)
            {
                case 0: row.Eco = rate; break;
                case 1: row.ThreeHour = rate; break;
                case 2: row.TwoHour = rate; break;
                case 3: row.NinetyMin = rate; break;
                case 4: row.SeventyFiveMin = rate; break;
                case 5: row.OneHour = rate; break;
                case 6: row.FortyFiveMin = rate; break;
                case 7: row.ThirtyMin = rate; break;
                case 8: row.FifteenMin = rate; break;
                case 9: row.Direct = rate; break;
            }
        }

        return row;
    }

    private async Task<List<ScheduledServiceRow>> GetScheduledServicesAsync(int clientId, CancellationToken ct)
    {
        // TODO: Wire to actual TMS API
        // GET /api/Clients/{clientId}/scheduled-services
        try
        {
            var response = await _httpClient.GetAsync($"/api/Clients/{clientId}/scheduled-services", ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<List<ScheduledServiceRow>>(ct) ?? new();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get scheduled services for client {ClientId}", clientId);
            return new();
        }
    }

    private async Task<ExtraChargesData> GetExtraChargesAsync(int clientId, CancellationToken ct)
    {
        // TODO: Wire to actual TMS API
        // GET /api/Clients/{clientId}/extra-charges
        try
        {
            var response = await _httpClient.GetAsync($"/api/Clients/{clientId}/extra-charges", ct);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<ExtraChargesData>(ct) ?? new();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to get extra charges for client {ClientId}, using defaults", clientId);
            return new ExtraChargesData
            {
                ExtraItemCharge = 40.14m,
                WeightSurcharges = new List<WeightSurcharge>
                {
                    new() { Label = "30-50kg", ThreeHour = 8.03m, TwoHour = 8.53m, NinetyMin = 9.03m, SeventyFiveMin = 10.00m, OneHourPlus = 10.54m },
                    new() { Label = "50kg+", ThreeHour = 8.03m, TwoHour = 8.53m, NinetyMin = 9.03m, SeventyFiveMin = 10.00m, OneHourPlus = 10.54m },
                },
                AfterHours = new AfterHoursCharges { Standard = 42.00m, Overnight = 63.00m, Saturday = 10.00m }
            };
        }
    }
}

// Internal DTOs for API responses
internal class ClientInfo
{
    public string Name { get; set; } = string.Empty;
    public string FromSuburb { get; set; } = string.Empty;
}

internal class SuburbInfo
{
    public int SuburbId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Area { get; set; } = string.Empty; // TucSuburb.UcsuArea grouping
}

/// <summary>
/// Maps to the result set from WS_stpJobType_Rates stored procedure.
/// </summary>
internal class SpRateResult
{
    public int JobTypeID { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal SaleRate { get; set; }
    public decimal Rate { get; set; }
    public bool Availability { get; set; }
}
