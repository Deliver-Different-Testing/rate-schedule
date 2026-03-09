namespace Accounts.Web.Features.RateSchedule.Models;

/// <summary>
/// Full rate schedule response wrapping client info and rate items.
/// </summary>
public class RateScheduleResponse
{
    public string ClientName { get; set; }
    public string FromSuburbName { get; set; }
    public string PreparedFor { get; set; }
    public decimal StandardRate { get; set; }
    public decimal VanRate { get; set; }
    public int StartingExcessWeight { get; set; }

    public List<RateScheduleItem> Items { get; set; } = new();

    /// <summary>Regional/national rate items (city-to-city).</summary>
    public List<RegionalRateItem> RegionalItems { get; set; } = new();

    /// <summary>International rate items (destination-based).</summary>
    public List<InternationalRateItem> InternationalItems { get; set; } = new();

    /// <summary>Whether this is a prospect (non-client) rate schedule.</summary>
    public bool IsProspect { get; set; }

    /// <summary>Prospect company name (only set when IsProspect = true).</summary>
    public string ProspectCompanyName { get; set; }
}
