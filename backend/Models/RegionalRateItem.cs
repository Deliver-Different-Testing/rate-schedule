namespace Accounts.Web.Features.RateSchedule.Models;

/// <summary>
/// A single row in the regional/national rate schedule.
/// Represents a city-to-city route at a given speed and weight tier.
/// </summary>
public class RegionalRateItem
{
    /// <summary>Origin city code (e.g. "akl").</summary>
    public string FromCityCode { get; set; }

    /// <summary>Origin city display name.</summary>
    public string FromCityName { get; set; }

    /// <summary>Destination city code (e.g. "wlg").</summary>
    public string ToCityCode { get; set; }

    /// <summary>Destination city display name.</summary>
    public string ToCityName { get; set; }

    /// <summary>Speed name: Regional Same Day, Regional Overnight, National Economy.</summary>
    public string SpeedName { get; set; }

    /// <summary>Weight tier label (e.g. "0-5kg", "5-15kg").</summary>
    public string WeightTier { get; set; }

    /// <summary>Minimum weight in kg for this tier (inclusive).</summary>
    public decimal WeightMinKg { get; set; }

    /// <summary>Maximum weight in kg for this tier (exclusive, except last tier).</summary>
    public decimal WeightMaxKg { get; set; }

    /// <summary>Calculated rate for this route/speed/weight combination.</summary>
    public decimal Rate { get; set; }

    /// <summary>Availability: Available, Possible, Unavailable.</summary>
    public string Availability { get; set; }

    public ServiceGroup ServiceGroup => ServiceGroup.Regional;
}
