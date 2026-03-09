namespace Accounts.Web.Features.RateSchedule.Models;

/// <summary>
/// Request DTO for generating a client rate schedule.
/// Maps to the parameters of REP_qryClientRateSchedule.
/// </summary>
public class RateScheduleRequest
{
    /// <summary>The client to generate rates for.</summary>
    public int ClientId { get; set; }

    /// <summary>Origin suburb. If null/0, defaults to the client's home suburb.</summary>
    public int? FromSuburbId { get; set; }

    /// <summary>"Prepared for" label on the rate schedule.</summary>
    public string PreparedFor { get; set; }

    /// <summary>Whether to include GST in the rates.</summary>
    public bool IncludeGst { get; set; }

    /// <summary>Whether to include fuel surcharge in the rates.</summary>
    public bool IncludeFuelSurcharge { get; set; }

    /// <summary>Percentage markup to apply (e.g. 10 = 10%).</summary>
    public double Markup { get; set; }

    /// <summary>Whether to include pick-pack-dispatch pricing.</summary>
    public bool IncludePpd { get; set; }
}
