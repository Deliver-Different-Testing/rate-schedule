namespace Accounts.Web.Features.RateSchedule.Models;

/// <summary>
/// Internal model for the client lookup data gathered at the start of rate schedule generation.
/// Populated from tblClient + tblRateCode + tblSuburb joins.
/// </summary>
internal class ClientRateInfo
{
    public int ClientId { get; set; }
    public int SiteId { get; set; }
    public string ClientName { get; set; }
    public int SuburbId { get; set; }
    public string SuburbName { get; set; }

    /// <summary>Standard rate code ID (UcclRate / StandardRateCodeID).</summary>
    public int? StandardRateCodeId { get; set; }

    /// <summary>Standard rate amount from tblRateCode.</summary>
    public decimal StandardRateAmount { get; set; }

    /// <summary>Van rate code ID.</summary>
    public int? VanRateCodeId { get; set; }

    /// <summary>Van rate amount from tblRateCode.</summary>
    public decimal VanRateAmount { get; set; }

    /// <summary>Starting weight for excess charges.</summary>
    public int StartingWeightExcess { get; set; }

    /// <summary>PPD rate (pick-pack-dispatch) from the client record.</summary>
    public decimal? PpdRate { get; set; }

    /// <summary>Whether economy speeds are active for this client.</summary>
    public bool EconomyActive { get; set; }

    /// <summary>Whether economy runs are active for this client.</summary>
    public bool EconomyRuns { get; set; }
}
