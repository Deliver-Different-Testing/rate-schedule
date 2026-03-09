namespace Accounts.Web.Features.RateSchedule.Models;

/// <summary>
/// A single row in the international rate schedule.
/// Represents a destination at a given speed and weight tier.
/// </summary>
public class InternationalRateItem
{
    /// <summary>Destination code (e.g. "syd", "lhr").</summary>
    public string DestinationCode { get; set; }

    /// <summary>Destination city name.</summary>
    public string City { get; set; }

    /// <summary>Destination country.</summary>
    public string Country { get; set; }

    /// <summary>Region grouping: australia, asia-pacific, americas, europe.</summary>
    public string Region { get; set; }

    /// <summary>Speed name: International Express, Standard, Economy.</summary>
    public string SpeedName { get; set; }

    /// <summary>Weight tier label.</summary>
    public string WeightTier { get; set; }

    /// <summary>Minimum weight in kg for this tier.</summary>
    public decimal WeightMinKg { get; set; }

    /// <summary>Maximum weight in kg for this tier.</summary>
    public decimal WeightMaxKg { get; set; }

    /// <summary>Calculated rate.</summary>
    public decimal Rate { get; set; }

    /// <summary>Availability: Available, Possible, Unavailable, QuoteRequired.</summary>
    public string Availability { get; set; }

    /// <summary>Whether this rate requires a manual quote (true for some destinations/weights).</summary>
    public bool RequiresQuote { get; set; }

    public ServiceGroup ServiceGroup => ServiceGroup.International;
}
