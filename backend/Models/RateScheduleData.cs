namespace Dfrnt.Reports.Models;

public class RateScheduleData
{
    public string ClientName { get; set; } = string.Empty;
    public string FromSuburb { get; set; } = string.Empty;
    public int SiteId { get; set; }
    public DateTime PrintDate { get; set; } = DateTime.Now;
    public List<RateRow> OnDemandRates { get; set; } = new();
    public List<ScheduledServiceRow> ScheduledServices { get; set; } = new();
    public ExtraChargesData Extras { get; set; } = new();
}

public class RateRow
{
    public string Destination { get; set; } = string.Empty;
    public decimal? Eco { get; set; }
    public decimal? ThreeHour { get; set; }
    public decimal? TwoHour { get; set; }
    public decimal? NinetyMin { get; set; }
    public decimal? SeventyFiveMin { get; set; }
    public decimal? OneHour { get; set; }
    public decimal? FortyFiveMin { get; set; }
    public decimal? ThirtyMin { get; set; }
    public decimal? FifteenMin { get; set; }
    public decimal? Direct { get; set; }

    /// <summary>Returns rate by speed column index (0=Eco, 1=3Hr, ..., 9=Direct)</summary>
    public decimal? GetRate(int index) => index switch
    {
        0 => Eco,
        1 => ThreeHour,
        2 => TwoHour,
        3 => NinetyMin,
        4 => SeventyFiveMin,
        5 => OneHour,
        6 => FortyFiveMin,
        7 => ThirtyMin,
        8 => FifteenMin,
        9 => Direct,
        _ => null
    };
}

public class ScheduledServiceRow
{
    public string Route { get; set; } = string.Empty;
    public string Service { get; set; } = string.Empty;
    public string ServiceBadge { get; set; } = string.Empty; // "NextDay", "SameDay", "Morning", "Afternoon"
    public string Schedule { get; set; } = string.Empty;
    public decimal BaseRate { get; set; }
    public decimal EstWithMFV { get; set; }
}

public class ExtraChargesData
{
    public decimal ExtraItemCharge { get; set; } = 40.14m;
    public List<WeightSurcharge> WeightSurcharges { get; set; } = new();
    public AfterHoursCharges AfterHours { get; set; } = new();
    public string VanMultiTripNote { get; set; } = "Extra charges may apply to multiple-item consignments that cannot be stacked in vehicle and/or require more than one trip by the courier (e.g. platters of food).";
    public string MfvNote { get; set; } = "All base rates in this schedule are exclusive of MFV. The monthly fuel variation is calculated based on the current price of fuel and applied at invoicing.";
    public string PpdNote { get; set; } = "A prompt payment discount may apply to invoices paid within the agreed term. PPD is excluded from the base rates shown.";
}

public class WeightSurcharge
{
    public string Label { get; set; } = string.Empty; // e.g. "30-50kg", "50kg+"
    public decimal ThreeHour { get; set; }
    public decimal TwoHour { get; set; }
    public decimal NinetyMin { get; set; }
    public decimal SeventyFiveMin { get; set; }
    public decimal OneHourPlus { get; set; }
}

public class AfterHoursCharges
{
    public decimal Standard { get; set; } = 42.00m;
    public decimal Overnight { get; set; } = 63.00m;
    public decimal Saturday { get; set; } = 10.00m;
}
