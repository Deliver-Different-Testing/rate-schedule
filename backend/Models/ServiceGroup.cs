namespace Accounts.Web.Features.RateSchedule.Models;

/// <summary>
/// Categorises job types into pricing model groups.
/// Each group uses a different pricing engine / data source.
/// </summary>
public enum ServiceGroup
{
    /// <summary>1hr, 2hr, 4hr, Same Day, Direct — suburb-to-suburb via UTL_fncJob_Rate.</summary>
    OnDemand,

    /// <summary>Overnight, Economy, Economy Run — same SP calls as on-demand.</summary>
    Scheduled,

    /// <summary>Regional Same Day, Regional Overnight, National Economy — city-to-city pricing.</summary>
    Regional,

    /// <summary>International Express, Standard, Economy — destination-country pricing.</summary>
    International
}
