namespace Accounts.Web.Features.RateSchedule.Models;

/// <summary>
/// Request DTO for generating a prospect (non-client) rate schedule.
/// Used when no client record exists — locations are provided directly.
/// </summary>
public class ProspectRateRequest
{
    /// <summary>Prospect company name.</summary>
    public string CompanyName { get; set; }

    /// <summary>Prospect contact name.</summary>
    public string ContactName { get; set; }

    /// <summary>Location mode: "suburbs" (NZ/AU) or "zipcodes" (US).</summary>
    public string LocationMode { get; set; } = "suburbs";

    /// <summary>List of locations uploaded by the user.</summary>
    public List<ProspectLocation> Locations { get; set; } = new();

    /// <summary>
    /// Optional base rate code ID to use for pricing.
    /// If null, uses the system default / list-price rate code.
    /// </summary>
    public int? BaseRateCodeId { get; set; }

    /// <summary>Whether to include GST.</summary>
    public bool IncludeGst { get; set; } = true;

    /// <summary>Whether to include fuel surcharge.</summary>
    public bool IncludeFuelSurcharge { get; set; } = true;

    /// <summary>Percentage markup (e.g. 10 = 10%).</summary>
    public double Markup { get; set; }

    /// <summary>Optional: which service groups to include.</summary>
    public List<string> ServiceGroups { get; set; }
}

/// <summary>
/// A single location in a prospect rate request.
/// Represents a suburb, town, or ZIP code provided by the user.
/// </summary>
public class ProspectLocation
{
    /// <summary>Location name (suburb name or ZIP code label).</summary>
    public string Name { get; set; }

    /// <summary>Optional postal/ZIP code.</summary>
    public string Code { get; set; }

    /// <summary>Optional zone/tier grouping.</summary>
    public string Zone { get; set; }

    /// <summary>Optional state/region.</summary>
    public string Region { get; set; }
}
